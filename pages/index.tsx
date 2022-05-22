// index.html
import {useEffect, useState} from 'react';
import { cardDb } from '../cards';
import { relicDb } from '../relics';
import { nameLookupFromCorrect } from '../name_lookup';
import correlations from '../correlations.json'
import { floors } from '../floors';
import pickRates from '../pickrates.json';

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

type CardItem = {
  name: string,
  upgraded: boolean,
};

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

type DeckList = CardItem[]
type RelicList = string[]

type AddedCardTarget = 'DECK' | 'OFFER';

type RecData = {
  cardName: string,
  pairsWith: string,
};

type Floor = number;

type FloorData = {
  act: number,
  desc: string,
  disabled?: boolean,
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

function getRecommendation(inventory: string[], offered: string[]): RecData {
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

function getPickRateString(card: CardItem, floor: Floor) {
  const cardString = card.name + (card.upgraded ? '+1' : '');
  let percent = Math.round(100 * pickRates[cardString][floor + ".0"]);
  let pickRate = percent + "%";
  return pickRate;
}

export default function HomePage() {
  const [decklist, updateDecklist] = useState<CardItem[]>([]);
  const [relicList, updateRelicList] = useState<string[]>([]);
  const [offerList, updateOfferList] = useState<CardItem[]>([]);
  const [selectedChar, updateSelectedChar] = useState<CharName>('IRONCLAD');
  const [addedCardTarget, updateAddedCardTarget] = useState<AddedCardTarget>('DECK')
  const [recommendation, updateRecommendation] = useState<RecData>({
    cardName: '',
    pairsWith: '',
  });
  const [floor, updateFloor] = useState<Floor>(1);

  useEffect(() => {
    const newRecommendation = getRecommendation(
      decklist.map(c => c.name).concat(relicList),
      offerList.map(c => c.name)
    );
    updateRecommendation(newRecommendation);
  }, [decklist, relicList, offerList]);

  function addCardToDeck(cardName: string) {
    const cardData = cardDb.find((card) => card.name === cardName);
    if (!cardData) {
      console.error(`Can't find card ${cardName}`);
      return;
    }
    const newCard: CardItem = {
      name: cardName,
      upgraded: false,
    };
    if (addedCardTarget === 'DECK') {
      updateDecklist([newCard, ...decklist]);
    } else if (addedCardTarget === 'OFFER') {
      updateOfferList([newCard, ...offerList]);
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
    ].map((name) => ({
      name: name,
      upgraded: false,
    })));
    updateRelicList([
      'Burning Blood',
    ]);
  }

  function handleAddRandCardClick(target: AddedCardTarget) {
    const cardsForChar = cardDb.filter((card) => card.char === selectedChar)
      .filter((c) => c.rarity !== 'Basic');
    const card = cardsForChar[Math.floor(Math.random()*cardsForChar.length)];
    const newCard: CardItem = {
      name: card.name,
      upgraded: false,
    };
    if (target==='DECK') {
      updateDecklist([newCard, ...decklist]);
    } else {
      updateOfferList([newCard, ...offerList]);
    }
  }

  function handleRandomizeOffersClick(target: AddedCardTarget) {
    const cardsForChar = cardDb.filter((card) => card.char === selectedChar)
      .filter((c) => c.rarity !== 'Basic');
    const newOffers = [];
    for (let i = 0; i < 3; i++) {
      const card = cardsForChar[Math.floor(Math.random()*cardsForChar.length)];
      newOffers.push(card);
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

  function upgradeCard(target: AddedCardTarget, index: number) {
    let tmp: CardItem[] = [];
    if (target==='DECK') {
      tmp = [...decklist];
    } else {
      tmp = [...offerList];
    }
    tmp[index].upgraded = !tmp[index].upgraded;
    if (target==='DECK') {
      updateDecklist(tmp);
    } else {
      updateOfferList(tmp);
    }
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
        paddingLeft: '.5rem',
      }}>
        <h2>Your Inventory</h2>
        <p>
          Floor:
          {' '}
          <FloorPicker
            floor={floor}
            floors={floors}
            handleChange={updateFloor}
          />
        </p>
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
        currentFloor={floor}
        handleUpgradeClick={(index) => upgradeCard('OFFER', index)}
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
              card={{
                name: card.name,
                upgraded: false,
              }}
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
            key={index}
            style={{
              marginBottom: '8px',
            }}
          >
            <DeckListCard
              handleClick={props.handleCardClick}
              card={card}
              index={index}
              isPicked={props.pairedCard == card.name}
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
            key={index}
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
  recommendation: RecData,
  handleAddRandClick,
  handleRandomizeClick,
  currentFloor: number,
  handleUpgradeClick,
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
            key={index}
            style={{
              marginBottom: '8px',
            }}
          >
            <DeckListCard
              handleClick={props.handleCardClick}
              card={card}
              index={index}
              isPicked={card.name === props.recommendation.cardName}
              showPickRate={true}
              currentFloor={props.currentFloor}
              handleUpgradeClick={props.handleUpgradeClick}
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
  card: CardItem,
  index: number,
  isPicked?: boolean,
  currentFloor?: Floor,
  showPickRate?: boolean,
  handleUpgradeClick?,
}) {
  let pickRate = '';
  if (props.showPickRate && props.currentFloor) {
    pickRate = getPickRateString(props.card, props.currentFloor);
  }
  const cardinfo: CardData = (cardDb as CardData[]).find(
    (card) => card.name === props.card.name
  );
  const cardClassNames = ['card', `card--rarity-${cardinfo.rarity.toLowerCase()}`];
  if (props.isPicked) {
    cardClassNames.push('card--picked');
  }
  return (
    <div
      onClick={props.handleUpgradeClick
        ? () => {}
        : () => props.handleClick(props.card.name, props.index)}
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
          {props.card.name}
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
        {props.handleUpgradeClick && (
          <button
            onClick={() => props.handleUpgradeClick(props.index)}
          >
            U
            {' '}
            {props.card.upgraded ? 'Yes' : 'No'}
          </button>
        )}
        {props.showPickRate && props.currentFloor && pickRate}
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
      style={{
        padding: "16px 0px",
        display: 'block',
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        checked={props.addCardsHere}
        onChange={props.handleClick}
      />
      Add cards here
    </label>
  );
}

function FloorPicker(props: {
  floors: {[key: number]: FloorData},
  floor: Floor,
  handleChange,
}) {
  return (
    <select
      onChange={(e) => props.handleChange(e.target[e.target.selectedIndex].getAttribute('value'))}
      value={props.floor}
    >
      {[1, 2, 3, 4].map((act) => (
        <optgroup
          key={act}
          label={`Act ${act}`}
        >
          {floors.filter((f) => f.act===act).map((floor) => (
            <option
              key={floor.floorNum}
              value={floor.floorNum}
              disabled={floor.disabled}
            >
              {floor.floorNum}
              {floor.desc && ` - ${floor.desc}`}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
