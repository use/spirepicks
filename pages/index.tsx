// index.html
import {useEffect, useState} from 'react';
import { cardDb } from '../cards';
import { relicDb } from '../relics';
import { nameLookupFromCorrect } from '../name_lookup';
import correlations from '../correlations.json'
import { floors } from '../floors';
import pickRates from '../pickrates.json';
import skipRate from '../skip_rate.json';

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

type HoveredItem = {
  name: string,
  location: 'DECK' | 'OFFER' | 'RELICS' | 'NONE',
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

function getSkipRate(floor: Floor): number {
  return skipRate[floor + ".0"];
}

function getRecommendation(
  inventory: string[],
  offered: CardItem[],
  floor: Floor,
  considerPickRates: boolean,
): RecData {
  let highest = -1;
  let selected = '';
  let pairsWith = '';
  for (let invIdx = 0; invIdx < inventory.length; invIdx++) {
    for (let offIdx = 0; offIdx < offered.length; offIdx++) {
      const corr = correlation(inventory[invIdx], offered[offIdx].name);
      let score = 0;
      if (considerPickRates) {
        const pickRate = getPickRate(offered[offIdx], floor);
        score = corr * pickRate;
      } else {
        score = corr;
      }

      if (score > highest) {
        highest = score;
        selected = offered[offIdx].name;
        pairsWith = inventory[invIdx];
      }
    }
  }
  if (getSkipRate(floor) * .03 > highest) {
    selected = 'SKIP';
    pairsWith = '';
  }
  return {
    cardName: selected,
    pairsWith: pairsWith,
  };
}

function getPickRate(card: CardItem, floor: Floor): number {
  const cardString = card.name + (card.upgraded ? '+1' : '');
  return pickRates[cardString][floor + ".0"];
}

function getPickRateString(card: CardItem, floor: Floor): string {
  let percent = Math.round(100 * getPickRate(card, floor));
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
  const [considerPickrates, updateConsiderPickrates] = useState<boolean>(false);
  const [hoveredItem, updateHoveredItem] = useState<HoveredItem>({
    name: '',
    location: 'NONE',
  });

  useEffect(() => {
    const newRecommendation = getRecommendation(
      decklist.map(c => c.name).concat(relicList),
      offerList,
      floor,
      considerPickrates
    );
    updateRecommendation(newRecommendation);
  }, [decklist, relicList, offerList, considerPickrates]);

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

  function addCardToDeckList(cardName: string, upgraded: boolean) {
    const cardData = cardDb.find((card) => card.name === cardName);
    if (!cardData) {
      console.error(`Can't find card ${cardName}`);
      return;
    }
    const newCard: CardItem = {
      name: cardName,
      upgraded: upgraded,
    }
    updateDecklist([newCard, ...decklist]);
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

  function handleDeckListRemoveCardClick(index: number) {
    const newList = [...decklist];
    newList.splice(index, 1);
    updateDecklist(newList);
  }

  function handleRelicListItemClick(relicName: string, index: number) {
    const newList = [...relicList];
    newList.splice(index, 1);
    updateRelicList(newList);
  }

  function handleOfferListRemoveCardClick(index: number) {
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

  function handleItemHover(itemName: string, location: HoveredItem['location']) {
    updateHoveredItem({
      name: itemName,
      location: location,
    });
  }

  function handleItemMouseLeave() {
    updateHoveredItem({
      name: '',
      location: 'NONE',
    });
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
          handleRemoveCardClick={handleDeckListRemoveCardClick}
          handleAddCardsHereClick={() => updateAddedCardTarget('DECK')}
          addCardsHere={addedCardTarget==='DECK'}
          pairedCard={recommendation.pairsWith}
          hoveredItem={hoveredItem}
          handleCardHover={handleItemHover}
          handleItemMouseLeave={handleItemMouseLeave}
        />
        <RelicInventory
          relicList={relicList}
          handleItemClick={handleRelicListItemClick}
          pairedItem={recommendation.pairsWith}
          hoveredItem={hoveredItem}
          handleItemHover={handleItemHover}
          handleItemMouseLeave={handleItemMouseLeave}
        />
      </div>
      <div>
        <OfferDisplay
          offerList={offerList}
          handleRemoveCardClick={handleOfferListRemoveCardClick}
          handleAddCardsHereClick={() => updateAddedCardTarget('OFFER')}
          addCardsHere={addedCardTarget==='OFFER'}
          recommendation={recommendation}
          handleAddRandClick={() => handleAddRandCardClick('OFFER')}
          handleRandomizeClick={handleRandomizeOffersClick}
          currentFloor={floor}
          handleUpgradeClick={(index) => upgradeCard('OFFER', index)}
          hoveredItem={hoveredItem}
          handleCardHover={handleItemHover}
          handleItemMouseLeave={handleItemMouseLeave}
          handleCardClick={addCardToDeckList}
        />
        <p>
          <label>
            <input
              type="checkbox"
              checked={considerPickrates}
              onChange={() => updateConsiderPickrates(!considerPickrates)}
            />
            {' Consider pickrates'}
          </label>
        </p>
      </div>
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
  handleRemoveCardClick,
  addCardsHere: boolean,
  handleAddCardsHereClick,
  pairedCard?: string,
  hoveredItem: HoveredItem,
  handleCardHover,
  handleItemMouseLeave,
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
              handleRemoveClick={props.handleRemoveCardClick}
              card={card}
              index={index}
              isPicked={props.pairedCard == card.name}
              showCorr={props.hoveredItem.location === 'OFFER'}
              hoveredItemName={props.hoveredItem.name}
              handleHover={(cardName) => props.handleCardHover(cardName, 'DECK')}
              handleMouseLeave={props.handleItemMouseLeave}
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
  hoveredItem: HoveredItem,
  handleItemHover,
  handleItemMouseLeave,
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
              showCorr={props.hoveredItem.location === 'OFFER'}
              hoveredItemName={props.hoveredItem.name}
              handleItemHover={(itemName) => props.handleItemHover(itemName, 'RELICS')}
              handleItemMouseLeave={props.handleItemMouseLeave}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OfferDisplay(props: {
  offerList: DeckList
  handleRemoveCardClick,
  addCardsHere: boolean,
  handleAddCardsHereClick,
  recommendation: RecData,
  handleAddRandClick,
  handleRandomizeClick,
  currentFloor: number,
  handleUpgradeClick,
  hoveredItem: HoveredItem,
  handleCardHover,
  handleItemMouseLeave,
  handleCardClick,
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
              handleRemoveClick={props.handleRemoveCardClick}
              card={card}
              index={index}
              isPicked={card.name === props.recommendation.cardName}
              showPickRate={true}
              currentFloor={props.currentFloor}
              handleUpgradeClick={props.handleUpgradeClick}
              showCorr={['DECK', 'RELICS'].includes(props.hoveredItem.location)}
              hoveredItemName={props.hoveredItem.name}
              handleHover={(cardName) => props.handleCardHover(cardName, 'OFFER')}
              handleMouseLeave={props.handleItemMouseLeave}
              handleClick={props.handleCardClick}
            />
          </li>
        ))}
      </ul>
      {props.recommendation.cardName && props.recommendation.cardName != 'SKIP' && (
        <p>
          Picked <strong>{props.recommendation.cardName}</strong>
          {' '}
          because you have <strong>{props.recommendation.pairsWith}</strong>.
        </p>
      )}
      {props.recommendation.cardName === 'SKIP' && (
        <p>
          You should <b>SKIP</b> because nothing looks great
        </p>
      )}
      <p>
        Skip rate for this floor is
        {' '}
        {Math.round(getSkipRate(props.currentFloor) * 100) + "%"}
      </p>
    </div>
  );
}


function RelicListItem(props: {
  handleClick,
  itemName: string,
  index: number,
  isPicked?: boolean,
  showCorr?: boolean,
  hoveredItemName?: string,
  handleItemHover?,
  handleItemMouseLeave?,
}) {
  const iteminfo: RelicData = (relicDb as RelicData[]).find(
    (item) => item.name === props.itemName
  );
  const cardClassNames = ['card', `card--rarity-${iteminfo.rarity.toLowerCase()}`];
  if (props.isPicked) {
    cardClassNames.push('card--picked');
  }
  const style = {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
  };
  let corr = 0;
  if (props.showCorr && props.hoveredItemName) {
    corr = correlation(props.hoveredItemName, props.itemName);
    corr = 2 * Math.round(corr * 100);
    style['backgroundColor'] = `hsl(138, 100%, ${100 - corr}%)`;
  }
  return (
    <div
      onClick={() => props.handleClick(props.itemName, props.index)}
      className={cardClassNames.join(' ')}
      onMouseOver={props.handleItemHover
        ? () => props.handleItemHover(props.itemName)
        : () => {}
      }
      onMouseLeave={props.handleItemMouseLeave || (() => {})}
    >
      <div
        style={style}
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
  handleClick?,
  handleRemoveClick?,
  card: CardItem,
  index: number,
  isPicked?: boolean,
  currentFloor?: Floor,
  showPickRate?: boolean,
  handleUpgradeClick?,
  showCorr?: boolean,
  hoveredItemName?: string,
  handleHover?,
  handleMouseLeave?,
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
  let style = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  };
  let corr = 0;
  if (props.showCorr && props.hoveredItemName) {
    corr = correlation(props.hoveredItemName, props.card.name);
    corr = 2 * Math.round(corr * 100);
    style['backgroundColor'] = `hsl(138, 100%, ${100 - corr}%)`;
  }
  return (
    <div
      // onClick={(props.handleUpgradeClick || props.handleRemoveClick)
      //   ? () => {}
      //   : () => props.handleClick(props.card.name, props.index)}
      className={cardClassNames.join(' ')}
      onMouseOver={props.handleHover
        ? () => props.handleHover(props.card.name)
        : () => {}
      }
      onMouseLeave={props.handleMouseLeave || (() => {})}
    >
      <div
        style={style}
        title={`(${cardinfo.rarity} ${cardinfo.type}) ${cardinfo.desc}`}
      >
        <div
          style={{display: 'flex', alignItems: 'baseline'}}
          onClick={props.handleClick
            ? () => props.handleClick(props.card.name, props.card.upgraded)
            : () => {}
          }
        >
          <div style={{
            padding: '4px 0 4px 8px',
          }}>
            {props.card.upgraded
              ?
              <span>
                {props.card.name}<b>+</b>
              </span>
              :
              props.card.name
            }
          </div>
          <div
            style={{
              fontSize: '.6rem',
              color: 'hsl(0, 0%, 45%)',
              paddingLeft: '8px',
            }}
          >{cardinfo.type}</div>
        </div>
        <div style={{display: 'flex'}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            {props.isPicked &&
              <div style={{marginLeft: '.5rem', marginRight: '.5rem'}}>
                ✅
              </div>
            }
            <div style={{marginRight: '.5rem'}}>
              {props.showPickRate && props.currentFloor && pickRate}
            </div>
          </div>
          {props.handleUpgradeClick && (
            <button
              title="Toggle upgrade"
              style={{
                appearance: 'none',
                border: 'none',
                borderLeft: '1px solid #ccc',
                backgroundColor: 'transparent',
                color: props.card.upgraded ? 'inherit' : '#999',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                cursor: 'pointer',
              }}
              onClick={() => props.handleUpgradeClick(props.index)}
            >
              +
            </button>
          )}
          {props.handleRemoveClick && (
            <button
              title="Remove"
              style={{
                appearance: 'none',
                border: 'none',
                borderLeft: '1px solid #ccc',
                backgroundColor: 'transparent',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => props.handleRemoveClick(props.index)}
            >
              ✖
            </button>
          )}
        </div>
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
