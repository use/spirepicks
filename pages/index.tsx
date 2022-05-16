// index.html
import {useEffect, useState} from 'react';
import { cardDb } from '../cards';
import { relicDb } from '../relics';
import Image from 'next/image';

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

export default function HomePage() {
  const [decklist, updateDecklist] = useState([]);
  const [relicList, updateRelicList] = useState([]);
  const [offerList, updateOfferList] = useState(['Shrug It Off', 'Anger', 'Demon Form']);
  const [selectedChar, updateSelectedChar] = useState<CharName>('IRONCLAD');
  const [addedCardTarget, updateAddedCardTarget] = useState<AddedCardTarget>('DECK')

  function addCardToDeck(cardName: string) {
    const cardData = cardDb.find((card) => card.name === cardName);
    if (!cardData) {
      console.error(`Can't find card ${cardName}`);
      return;
    }
    if (addedCardTarget === 'DECK') {
      updateDecklist([...decklist, cardName]);
    } else if (addedCardTarget === 'OFFER') {
      updateOfferList([...offerList, cardName]);
    }
  }

  function addRelic(relicName: string) {
    const relicData = relicDb.find((relic) => relic.name === relicName);
    if (!relicData) {
      console.error(`Can't find relic ${relicName}`);
      return;
    }
    updateRelicList([...relicList, relicName]);
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

  return (
    <div
      style={{
        display: "grid",
        gridGap: '2rem',
        gridTemplateColumns: '250px 250px 250px 250px',
        maxHeight: "90vh",
      }}
    >
      <CardPicker
        cardDb={cardDb as CardData[]}
        handleCardClick={addCardToDeck}
        selectedChar={selectedChar}
        addedCardTarget={addedCardTarget}
        handleAddedCardTargetClick={handleAddedCardTargetClick}
      />
      <RelicPicker
        relicDb={relicDb as RelicData[]}
        selectedChar={selectedChar}
        handleClick={addRelic}
      />
      <div>
        <h2>Your Inventory</h2>
        <DeckDisplay
          decklist={decklist}
          handleCardClick={handleDeckListCardClick}
          handleAddCardsHereClick={() => updateAddedCardTarget('DECK')}
          addCardsHere={addedCardTarget==='DECK'}
        />
        <RelicInventory
          relicList={relicList}
          handleItemClick={handleRelicListItemClick}
        />
      </div>
      <OfferDisplay
        offerList={offerList}
        handleCardClick={handleOfferListCardClick}
        handleAddCardsHereClick={() => updateAddedCardTarget('OFFER')}
        addCardsHere={addedCardTarget==='OFFER'}
      />
    </div>
  );
}

function CardPicker(props: {
  cardDb: CardData[]
  handleCardClick: (cardName: string) => void,
  handleAddedCardTargetClick: (x: AddedCardTarget) => void,
  selectedChar: CharName,
  addedCardTarget: AddedCardTarget,
}) {
  const cardsForChar = props.cardDb.filter((card) => card.char === props.selectedChar);
  return (
    <div>
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
  );
  return (
    <div>
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
}) {
  return (
    <div>
      <h2>Being Offered</h2>
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
            />
          </li>
        ))}
      </ul>
    </div>
  );
}


function RelicListItem(props: {
  handleClick,
  itemName: string,
  index: number,
}) {
  const iteminfo: RelicData = (relicDb as RelicData[]).find(
    (item) => item.name === props.itemName
  );
  return (
    <div
      onClick={() => props.handleClick(props.itemName, props.index)}
      className='card'
      style={{
      }}
    >
      <div
        className={`card--rarity-${iteminfo.rarity.toLowerCase()}`}
        style={{
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <img
          src={`relics/${iteminfo.name}.png`}
          alt={iteminfo.name}
          style={{
            height: '32px',
            width: '32px',
            objectFit: 'contain',
            marginRight: '8px',
          }}
        />
        <div>{props.itemName}</div>
      </div>
    </div>
  );
}

function DeckListCard(props: {
  handleClick,
  cardName: string,
  index: number,
}) {
  const cardinfo: CardData = (cardDb as CardData[]).find(
    (card) => card.name === props.cardName
  );
  return (
    <div
      onClick={() => props.handleClick(props.cardName, props.index)}
      className='card'
      style={{
      }}
      
    >
      <div
        className={`card--rarity-${cardinfo.rarity.toLowerCase()}`}
        style={{
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'baseline'
        }}
      >
        <div>{props.cardName}</div>
        <div
          style={{
            fontSize: '.6rem',
            color: 'hsl(0, 0%, 45%)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            paddingLeft: '8px',
          }}
        >{cardinfo.type}</div>
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
