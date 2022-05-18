// index.html
import {useEffect, useState} from 'react';
import { cardDb } from '../cards';
import { relicDb } from '../relics';
import Image from 'next/image';
import { nameLookupFromCorrect } from '../name_lookup';
import * as correlations from '../correlations.json'

type CardData  = {
  name: string,
  type: string,
  rarity:
    // string,
    Rarity,
  cost: string,
  desc: string,
  desc_upgraded: string,
  char:
    // string,
    'IRONCLAD' |
    'SILENT' |
    'DEFECT' |
    'WATCHER' |
    'COLORLESS' |
    'CURSE' |
    'STATUS',
}

type RelicData = {
  name: string,
  rarity: Rarity,
  char: CharName | "",
  desc: string,
  flavor: string,
  cond: string,
}

type Rarity = 'Basic' | 'Common' | 'Uncommon' | 'Rare' | 'Special' | 'Curse';
type CharName = 'IRONCLAD' | 'SILENT' | 'DEFECT' | 'WATCHER';

type DeckList = string[]
type RelicList = string[]

type AddedCardTarget = 'DECK' | 'OFFER';

type recData = {
  cardName: string,
  pairsWith: string,
};

function correlation(a: string, b: string) {
  const itemA = nameLookupFromCorrect.get(a);
  const itemB = nameLookupFromCorrect.get(b);
  let lookupStr = '';
  if (itemB > itemA) {
    lookupStr = `${itemA}|${itemB}`
  } else {
    lookupStr = `${itemB}|${itemA}`
  }
  return correlations.PCC[lookupStr];
}

function getRecommendation(inventory: string[], offered: string[]): recData {
  let highest = -1;
  let selected = '';
  let pairsWith = '';
  for (let invIdx = 0; invIdx < inventory.length; invIdx++) {
    for (let offIdx = 0; offIdx < offered.length; offIdx++) {
      const corr = correlation(inventory[invIdx], offered[offIdx]);
      if (corr > highest) {
        highest = corr;
        selected = offered[offIdx];
        pairsWith = inventory[invIdx];
      }
    }
  }
  return {
    cardName: selected,
    pairsWith: pairsWith,
  };
}

export default function HomePage() {
  const [decklist, updateDecklist] = useState<string[]>([]);
  const [relicList, updateRelicList] = useState<string[]>([]);
  const [offerList, updateOfferList] = useState<string[]>([]);
  const [selectedChar, updateSelectedChar] = useState<CharName>('IRONCLAD');
  const [addedCardTarget, updateAddedCardTarget] = useState<AddedCardTarget>('DECK')
  const [recommendation, updateRecommendation] = useState<recData>({
    cardName: '',
    pairsWith: '',
  });

  useEffect(() => {
    const newRecommendation = getRecommendation(
      decklist.concat(relicList),
      offerList
    );
    updateRecommendation(newRecommendation);
  }, [decklist, relicList, offerList]);

  function addCardToDeck(cardName: string) {
    const cardData = cardDb.find((card) => card.name === cardName);
    if (!cardData) {
      console.error(`Can't find card ${cardName}`);
      return;
    }
    if (addedCardTarget === 'DECK') {
      updateDecklist([cardName, ...decklist]);
    } else if (addedCardTarget === 'OFFER') {
      updateOfferList([cardName, ...offerList]);
    }
  }

  function addRelic(relicName: string) {
    const relicData = relicDb.find((relic) => relic.name === relicName);
    if (!relicData) {
      console.error(`Can't find relic ${relicName}`);
      return;
    }
    updateRelicList([relicName, ...relicList]);
  }

  function handleAddedCardTargetClick(newTarget: AddedCardTarget) {
    updateAddedCardTarget(newTarget);
  }

  function handleDeckListCardClick(card: string, index: number) {
    const newList = [...decklist];
    newList.splice(index, 1);
    updateDecklist(newList);
  }

  function handleRelicListItemClick(relicName: string, index: number) {
    const newList = [...relicList];
    newList.splice(index, 1);
    updateRelicList(newList);
  }

  function handleOfferListCardClick(card: string, index: number) {
    const newList = [...offerList];
    newList.splice(index, 1);
    updateOfferList(newList);
  }

  function handleAddStarterDeckClick() {
    updateDecklist([
      'Strike', 'Strike', 'Strike', 'Strike', 'Strike', 
      'Defend', 'Defend', 'Defend', 'Defend',
      'Bash',
    ]);
    updateRelicList([
      'Burning Blood',
    ]);
  }

  function handleAddRandCardClick(target: AddedCardTarget) {
    const cardsForChar = cardDb.filter((card) => card.char === selectedChar);
    const card = cardsForChar[Math.floor(Math.random()*cardsForChar.length)];
    if (target==='DECK') {
      updateDecklist([card.name, ...decklist]);
    } else {
      updateOfferList([card.name, ...offerList]);
    }
  }

  function handleRandomizeOffersClick(target: AddedCardTarget) {
    const cardsForChar = cardDb.filter((card) => card.char === selectedChar);
    const newOffers = [];
    for (let i = 0; i < 3; i++) {
      const card = cardsForChar[Math.floor(Math.random()*cardsForChar.length)];
      newOffers.push(card.name);
    }
    updateOfferList(newOffers);
  }

  function handleAddRandRelicClick() {
    const relicsForChar = relicDb.filter((relic) =>
      (relic.char === selectedChar || relic.char === "")
      &&
      !relicList.includes(relic.name)
    );
    const relic = relicsForChar[Math.floor(Math.random()*relicsForChar.length)];
    updateRelicList([...relicList, relic.name]);
  }

  return (
    <div
      style={{
        display: "grid",
        gridGap: '2rem',
        gridTemplateColumns: '280px 280px 280px 280px',
        height: 'calc(100vh - 40px)',
      }}
    >
      <div style={{
        gridColumn: '1 / 5'
      }}>
        Character:{' '}
        <CharSelectButton char="IRONCLAD" selected={true}/>{' '}
        <CharSelectButton char="SILENT" disabled={true}/>{' '}
        <CharSelectButton char="DEFECT" disabled={true}/>{' '}
        <CharSelectButton char="WATCHER" disabled={true}/>
      </div>
      <RelicPicker
        relicDb={relicDb as RelicData[]}
        selectedChar={selectedChar}
        handleClick={addRelic}
      />
      <CardPicker
        cardDb={cardDb as CardData[]}
        handleCardClick={addCardToDeck}
        selectedChar={selectedChar}
        addedCardTarget={addedCardTarget}
        handleAddedCardTargetClick={handleAddedCardTargetClick}
      />
      <div style={{
        overflowY: 'auto',
        paddingRight: '1rem',
      }}>
        <h2>Your Inventory</h2>
        <p>
          <button
            onClick={handleAddStarterDeckClick}
          >Set to Starter Inventory</button>
        </p>
        <p>
          <button
            onClick={() => handleAddRandCardClick('DECK')}
          >+ Random Card</button>
          {' '}
          <button
            onClick={handleAddRandRelicClick}
          >+ Random Relic</button>
        </p>
        <DeckDisplay
          decklist={decklist}
          handleCardClick={handleDeckListCardClick}
          handleAddCardsHereClick={() => updateAddedCardTarget('DECK')}
          addCardsHere={addedCardTarget==='DECK'}
          pairedCard={recommendation.pairsWith}
        />
        <RelicInventory
          relicList={relicList}
          handleItemClick={handleRelicListItemClick}
          pairedItem={recommendation.pairsWith}
        />
      </div>
      <OfferDisplay
        offerList={offerList}
        handleCardClick={handleOfferListCardClick}
        handleAddCardsHereClick={() => updateAddedCardTarget('OFFER')}
        addCardsHere={addedCardTarget==='OFFER'}
        recommendation={recommendation}
        handleAddRandClick={() => handleAddRandCardClick('OFFER')}
        handleRandomizeClick={handleRandomizeOffersClick}
      />
    </div>
  );
}

function CharSelectButton(props: {
  char: CharName,
  selected?: boolean,
  disabled?: boolean,
}) {
  return (
    <button disabled={props.disabled}>{props.char}</button>
  )
}

function CardPicker(props: {
  cardDb: CardData[]
  handleCardClick: (cardName: string) => void,
  handleAddedCardTargetClick: (x: AddedCardTarget) => void,
  selectedChar: CharName,
  addedCardTarget: AddedCardTarget,
}) {
  const cardsForChar = props.cardDb
    .filter((card) => card.char === props.selectedChar)
    .sort((a, b) => a.name > b.name ? 1 : -1);;
  return (
    <div style={{
      overflowY: 'scroll',
      overflowX: 'hidden',
      paddingRight: '1rem',
      paddingLeft: '.5rem',
    }}>
      <h2>Add Cards</h2>
      <ul className="list-unstyled">
        {cardsForChar.map((card, index) => (
          <li
            key={`${card.name}_${card.char}`}
            style={{
              marginBottom: '8px',
            }}
          >
            <DeckListCard
              handleClick={() => props.handleCardClick(card.name)}
              cardName={card.name}
              index={index}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelicPicker(props: {
  relicDb: RelicData[]
  handleClick: (cardName: string) => void,
  selectedChar: CharName,
}) {
  const relicsForChar = props.relicDb.filter((card) =>
    card.char === props.selectedChar || card.char === ""
  ).sort((a, b) => a.name > b.name ? 1 : -1);
  return (
    <div style={{
      overflowY: 'scroll',
      paddingRight: '1rem',
      paddingLeft: '.5rem',
    }}>
      <h2>Add Relics</h2>
      <ul className="list-unstyled">
        {relicsForChar.map((item, index) => (
          <li
            key={`${item.name}_${item.char}`}
            style={{
              marginBottom: '8px',
            }}
          >
            <RelicListItem
              handleClick={() => props.handleClick(item.name)}
              itemName={item.name}
              index={index}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeckDisplay(props: {
  decklist: DeckList,
  handleCardClick,
  addCardsHere: boolean,
  handleAddCardsHereClick,
  pairedCard?: string,
}) {
  return (
    <div>
      <h3>Deck</h3>
      <CardsGoHerePicker
        handleClick={props.handleAddCardsHereClick}
        addCardsHere={props.addCardsHere}
      />
      <ul className="list-unstyled">
        {props.decklist.map((card, index) => (
          <li
            style={{
              marginBottom: '8px',
            }}
          >
            <DeckListCard
              handleClick={props.handleCardClick}
              cardName={card}
              index={index}
              isPicked={props.pairedCard == card}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelicInventory(props: {
  relicList: RelicList,
  handleItemClick,
  pairedItem?: string,
}) {
  return (
    <div>
      <h3>Relics</h3>
      <ul className="list-unstyled">
        {props.relicList.map((itemName, index) => (
          <li
            style={{
              marginBottom: '8px',
            }}
          >
            <RelicListItem
              handleClick={props.handleItemClick}
              itemName={itemName}
              index={index}
              isPicked={props.pairedItem == itemName}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OfferDisplay(props: {
  offerList: DeckList
  handleCardClick,
  addCardsHere: boolean,
  handleAddCardsHereClick,
  recommendation: recData,
  handleAddRandClick,
  handleRandomizeClick
}) {
  // find the best card
  return (
    <div>
      <h2>Being Offered</h2>
      <button
        onClick={props.handleAddRandClick}
      >+ Random Card</button>
      {' '}
      <button
        onClick={props.handleRandomizeClick}
      >Random Three</button>
      <CardsGoHerePicker
        handleClick={props.handleAddCardsHereClick}
        addCardsHere={props.addCardsHere}
      />
      <ul className="list-unstyled">
        {props.offerList.map((card, index) => (
          <li
            style={{
              marginBottom: '8px',
            }}
          >
            <DeckListCard
              handleClick={props.handleCardClick}
              cardName={card}
              index={index}
              isPicked={card === props.recommendation.cardName}
            />
          </li>
        ))}
      </ul>
      {props.recommendation.cardName && (
        <p>
          Picked <strong>{props.recommendation.cardName}</strong>
          {' '}
          because you have <strong>{props.recommendation.pairsWith}</strong>.
        </p>
      )}
    </div>
  );
}


function RelicListItem(props: {
  handleClick,
  itemName: string,
  index: number,
  isPicked?: boolean,
}) {
  const iteminfo: RelicData = (relicDb as RelicData[]).find(
    (item) => item.name === props.itemName
  );
  const cardClassNames = ['card', `card--rarity-${iteminfo.rarity.toLowerCase()}`];
  if (props.isPicked) {
    cardClassNames.push('card--picked');
  }
  return (
    <div
      onClick={() => props.handleClick(props.itemName, props.index)}
      className={cardClassNames.join(' ')}
    >
      <div
        style={{
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
        }}
        title={`(${iteminfo.rarity}) ${iteminfo.desc}`}
      >
        <img
          src={`relics/${iteminfo.name}.png`}
          alt={iteminfo.name}
          style={{
            height: '48px',
            width: '48px',
            objectFit: 'contain',
            marginRight: '4px',
            marginLeft: "-4px",
            marginTop: "-4px",
            marginBottom: "-4px",
          }}
        />
        <div>{props.itemName}</div>
        {props.isPicked &&
          <div style={{marginLeft: '.5rem'}}>
            ✅
          </div>
        }
      </div>
    </div>
  );
}

function DeckListCard(props: {
  handleClick,
  cardName: string,
  index: number,
  isPicked?: boolean,
}) {
  const cardinfo: CardData = (cardDb as CardData[]).find(
    (card) => card.name === props.cardName
  );
  const cardClassNames = ['card', `card--rarity-${cardinfo.rarity.toLowerCase()}`];
  if (props.isPicked) {
    cardClassNames.push('card--picked');
  }
  return (
    <div
      onClick={() => props.handleClick(props.cardName, props.index)}
      className={cardClassNames.join(' ')}
    >
      <div
        style={{
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'baseline'
        }}
        title={`(${cardinfo.rarity} ${cardinfo.type}) ${cardinfo.desc}`}
      >
        <div>
          {props.cardName}
        </div>
        <div
          style={{
            fontSize: '.6rem',
            color: 'hsl(0, 0%, 45%)',
            paddingLeft: '8px',
          }}
        >{cardinfo.type}</div>
        {props.isPicked &&
          <div style={{marginLeft: '.5rem'}}>
            ✅
          </div>
        }
      </div>
    </div>
  );
}

function CardsGoHerePicker(props: {
  handleClick,
  addCardsHere: boolean,
}) {
  return (
    <label
      onClick={props.handleClick}
      style={{
        padding: "16px 0px",
        display: 'block',
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        checked={props.addCardsHere}
      />
      Add cards here
    </label>
  );
}
