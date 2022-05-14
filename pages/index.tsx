// index.html
import {useState} from 'react';
import { cardDb } from '../cards';

type CardData  = {
  name: string,
  type: string,
  rarity:
    // string,
    'Basic' |
    'Common' |
    'Uncommon' |
    'Rare' |
    'Special' |
    'Curse',
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

type CharName = 'IRONCLAD' | 'SILENT' | 'DEFECT' | 'WATCHER';

type DeckList = string[]

export default function HomePage() {
  const [decklist, updateDecklist] = useState([]);
  const [selectedChar, updateSelectedChar] = useState<CharName>('IRONCLAD');

  function addCardToDeck(cardName: string) {
    const cardData = cardDb.find((card) => card.name === cardName);
    if (!cardData) {
      console.error(`Can't find card ${cardName}`);
      return;
    }
    updateDecklist([...decklist, cardName]);
  }

  return (
    <div style={{display: "flex"}}>
      <CardPicker
        cardDb={cardDb as CardData[]}
        handleCardClick={addCardToDeck}
        selectedChar={selectedChar}
      />
      <DeckDisplay decklist={decklist}/>
    </div>
  );
}

function CardPicker(props: {
  cardDb: CardData[]
  handleCardClick: (cardName: string) => void,
  selectedChar: CharName
}) {
  const cardsForChar = props.cardDb.filter((card) => card.char === props.selectedChar);
  return (
    <ul>
      {cardsForChar.map((card) => (
        <li
          key={`${card.name}_${card.char}`}
          onDoubleClick={() => props.handleCardClick(card.name)}>
          {card.name} ({card.rarity})
        </li>
      ))}
    </ul>
  );
}

function DeckDisplay(props: {
  decklist: DeckList
}) {
  return (
    <ul>
      {props.decklist.map((card) => (
        <li>{card}</li>
      ))}
    </ul>
  );
}

function Card({
  cardinfo: cardinfo,
  clickHandler: clickHandler,
}) {
  return (
    <div
      onClick={() => clickHandler()}
      className={`card-`+cardinfo.rarity}
    >
      {cardinfo.title} ({cardinfo.rarity})
    </div>
  );
}
