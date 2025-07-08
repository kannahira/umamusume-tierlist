import './App.css';
import cards from './cards';
import TierList from './components/TierList';
import Weights from './components/Weights';
import SelectedCards from './components/SelectedCards';
import CollectionManager from './components/CollectionManager';
import React from 'react';

const ordinal = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
const type_names = [
  'Speed',
  'Stamina',
  'Power',
  'Guts',
  'Wisdom',
  '',
  'Friend',
];

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      weights: {
        type: 0,
        bondPerDay: 3.5,
        trainingDays: 50,
        races: [10, 10, 5, 3],
        unbondedTrainingGain: [
          [8, 0, 4, 0, 0, 2, 19],
          [0, 7, 0, 3, 0, 2, 17],
          [0, 4, 6, 0, 0, 2, 18],
          [3, 0, 3, 6, 0, 2, 20],
          [2, 0, 0, 0, 6, 3, 0],
        ],
        bondedTrainingGain: [
          [10, 0, 4, 0, 0, 2, 21],
          [0, 8, 0, 3, 0, 2, 18],
          [0, 4, 7, 0, 0, 2, 19],
          [4, 0, 3, 9, 0, 2, 24],
          [3, 0, 0, 0, 9, 3, 0],
        ],
        summerTrainingGain: [
          [11, 0, 5, 0, 0, 2, 22],
          [0, 9, 0, 6, 0, 2, 21],
          [0, 4, 10, 0, 0, 2, 21],
          [3, 0, 2, 10, 0, 2, 24],
          [3, 0, 0, 0, 9, 3, 0],
        ],
        umaBonus: [1, 1, 1, 1, 1, 1],
        stats: [1, 1, 1.1, 1, 1, 0.5, 1.5],
        multi: 1,
        bonusFS: 0,
        bonusSpec: 0,
        motivation: 0.2,
        scenarioLink: [],
        scenarioBonus: 0,
        fanBonus: 0.05,
        prioritize: true,
        onlySummer: false,
      },
      selectedCards: [],
      availableCards: cards,
      label: 'Ranking for the 4th Speed card in this deck:',
      collection: new Set(), // Set of "cardId_limitBreak" strings
    };

    this.onWeightsChanged = this.onWeightsChanged.bind(this);
    this.onCardSelected = this.onCardSelected.bind(this);
    this.onCardRemoved = this.onCardRemoved.bind(this);
    this.onLoadPreset = this.onLoadPreset.bind(this);
    this.onCollectionChange = this.onCollectionChange.bind(this);
    this.onClearCollection = this.onClearCollection.bind(this);
    this.onSelectAll = this.onSelectAll.bind(this);
  }

  componentDidMount() {
    // Load collection from localStorage
    const savedCollection = localStorage.getItem('umaCollection');
    if (savedCollection) {
      try {
        const collectionArray = JSON.parse(savedCollection);
        this.setState({ collection: new Set(collectionArray) });
      } catch (error) {
        console.error('Failed to load collection from localStorage:', error);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Update availableCards when collection changes
    if (prevState.collection !== this.state.collection) {
      this.updateAvailableCards();
    }
  }

  updateAvailableCards() {
    let availableCards = cards;

    // Filter by collection if there are cards in the collection
    if (this.state.collection && this.state.collection.size > 0) {
      availableCards = cards.filter((card) => {
        const collectionKey = `${card.id}_${card.limit_break}`;
        return this.state.collection.has(collectionKey);
      });
    }

    this.setState({ availableCards });
  }

  onWeightsChanged(statWeights, generalWeights) {
    let combinedWeights = { ...statWeights, ...generalWeights };
    this.setState({ weights: combinedWeights });
  }

  onCardSelected(card) {
    if (this.state.selectedCards.length > 5) return;
    let cards = this.state.selectedCards.slice();
    let index = this.state.selectedCards.findIndex((c) => c.id === card.id);

    if (index > -1) {
      cards[index] = card;
    } else {
      cards.push(card);
    }

    // Ensure the selected card is in the collection
    const collectionKey = `${card.id}_${card.limit_break}`;
    if (!this.state.collection.has(collectionKey)) {
      const newCollection = new Set(this.state.collection);
      newCollection.add(collectionKey);
      this.setState({
        selectedCards: cards,
        collection: newCollection,
      });

      // Save to localStorage
      localStorage.setItem(
        'umaCollection',
        JSON.stringify(Array.from(newCollection)),
      );
    } else {
      this.setState({ selectedCards: cards });
    }
  }

  onCardRemoved(card) {
    if (this.state.selectedCards.length === 1) return;
    let cards = this.state.selectedCards.slice();
    let cardIndex = cards.findIndex((c) => c.id === card.id);
    cards.splice(cardIndex, 1);
    this.setState({ selectedCards: cards });
  }

  onLoadPreset(presetCards) {
    let selectedCards = [];
    for (let i = 0; i < presetCards.length; i++) {
      selectedCards.push(
        cards.find((c) => c.id === presetCards[i] && c.limit_break === 4),
      );
    }
    this.setState({ selectedCards: selectedCards });
  }

  onCollectionChange(cardId, limitBreak) {
    const collectionKey = `${cardId}_${limitBreak}`;
    const newCollection = new Set(this.state.collection);

    if (newCollection.has(collectionKey)) {
      newCollection.delete(collectionKey);
    } else {
      newCollection.add(collectionKey);
    }

    this.setState({ collection: newCollection });

    // Save to localStorage
    localStorage.setItem(
      'umaCollection',
      JSON.stringify(Array.from(newCollection)),
    );
  }

  onClearCollection() {
    this.setState({ collection: new Set() });
    localStorage.removeItem('umaCollection');
  }

  onSelectAll() {
    const allCards = new Set();
    cards.forEach((card) => {
      allCards.add(`${card.id}_${card.limit_break}`);
    });
    this.setState({ collection: allCards });
    localStorage.setItem('umaCollection', JSON.stringify(Array.from(allCards)));
  }

  render() {
    return (
      <div className="App">
        <h1>Uma Musume Support Card Tier List</h1>
        <span class="section-explanation">
          For more game information, check the{' '}
          <a href="https://docs.google.com/document/d/1gNcV7XLmxx0OI2DEAR8gmKb8P9BBhcwGhlJOVbYaXeo/edit?usp=sharing">
            Uma Musume Reference
          </a>
          <br />
          This tier list defaults to the Grandmasters Scenario and doesn't
          consider skills, only stats.
          <br />
        </span>
        <Weights onChange={this.onWeightsChanged} />
        <CollectionManager
          collection={this.state.collection}
          onCollectionChange={this.onCollectionChange}
          onClearCollection={this.onClearCollection}
          onSelectAll={this.onSelectAll}
        />
        <SelectedCards
          selectedCards={this.state.selectedCards}
          onClick={this.onCardRemoved}
          onLoadPreset={this.onLoadPreset}
          weights={this.state.weights}
        />
        <TierList
          cards={this.state.availableCards}
          weights={this.state.weights}
          selectedCards={this.state.selectedCards}
          cardSelected={this.onCardSelected}
          collection={this.state.collection}
        />
      </div>
    );
  }
}

export default App;
