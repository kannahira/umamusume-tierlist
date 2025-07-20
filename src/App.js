import './App.css';
import cards from './cards';
import TierList from './components/TierList';
import Weights from './components/Weights';
import SelectedCards from './components/SelectedCards';
import CollectionManager from './components/CollectionManager';
import React from 'react';
import {
  GLOBAL_LATEST_R_ID,
  GLOBAL_LATEST_SR_ID,
  GLOBAL_LATEST_SSR_ID,
} from './constants';

// Helper to filter cards for global
function filterGlobalCards(cardList) {
  return cardList.filter((card) => {
    if (card.rarity === 1) return card.id <= GLOBAL_LATEST_R_ID;
    if (card.rarity === 2) return card.id <= GLOBAL_LATEST_SR_ID;
    if (card.rarity === 3) return card.id <= GLOBAL_LATEST_SSR_ID;
    return false;
  });
}

class App extends React.Component {
  constructor(props) {
    super(props);
    // Filter cards for global on initial load
    let globalCards = filterGlobalCards(cards);
    let initialCollection = new Set();
    let initialAvailableCards = globalCards.filter(
      (card) => card.limit_break === 4,
    );
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
      borrowedCard: null, // Track the borrowed card separately
      availableCards: initialAvailableCards,
      label: 'Ranking for the 4th Speed card in this deck:',
      collection: initialCollection,
    };

    this.onWeightsChanged = this.onWeightsChanged.bind(this);
    this.onCardSelected = this.onCardSelected.bind(this);
    this.onCardRemoved = this.onCardRemoved.bind(this);
    this.onBorrowedCardRemoved = this.onBorrowedCardRemoved.bind(this);
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
    let availableCards = filterGlobalCards(cards);

    // If collection is empty, treat as owning all MLB cards
    if (!this.state.collection || this.state.collection.size === 0) {
      availableCards = availableCards.filter((card) => card.limit_break === 4);
    } else {
      // Filter by collection if there are cards in the collection
      availableCards = availableCards.filter((card) => {
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
    // Prevent adding the borrowed card as a normal card
    if (this.state.borrowedCard && this.state.borrowedCard.id === card.id) {
      return;
    }
    let cards = this.state.selectedCards.slice();
    let index = this.state.selectedCards.findIndex((c) => c.id === card.id);

    // If we have 5 cards and this is a different card, treat it as the borrowed card
    if (this.state.selectedCards.length === 5 && index === -1) {
      // Set as borrowed card (always MLB)
      const borrowedCard = { ...card, limit_break: 4 };
      this.setState({ borrowedCard: borrowedCard });
      return;
    }

    // Normal card selection (0-4 cards)
    if (this.state.selectedCards.length >= 5) return; // Maximum 5 cards for owned cards

    if (index > -1) {
      cards[index] = card;
    } else {
      cards.push(card);
    }

    // If collection is empty, don't restrict selection (treat as owning all MLB cards)
    if (!this.state.collection || this.state.collection.size === 0) {
      this.setState({ selectedCards: cards });
      return;
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

  onBorrowedCardRemoved(card) {
    this.setState({ borrowedCard: null });
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

  onCollectionChange(cardId, limitBreak, newCollection) {
    let collectionToUse;
    if (newCollection) {
      collectionToUse = new Set(newCollection);
    } else {
      const collectionKey = `${cardId}_${limitBreak}`;
      collectionToUse = new Set(this.state.collection);
      if (collectionToUse.has(collectionKey)) {
        collectionToUse.delete(collectionKey);
      } else {
        collectionToUse.add(collectionKey);
      }
    }

    this.setState({ collection: collectionToUse });

    // Save to localStorage
    localStorage.setItem(
      'umaCollection',
      JSON.stringify(Array.from(collectionToUse)),
    );
  }

  onClearCollection() {
    this.setState({ collection: new Set() });
    localStorage.removeItem('umaCollection');
  }

  onSelectAll(allCardsSet) {
    this.setState({ collection: allCardsSet });
    localStorage.setItem(
      'umaCollection',
      JSON.stringify(Array.from(allCardsSet)),
    );
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
          This tier list defaults to the URA Scenario and doesn't consider
          skills, only stats.
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
          borrowedCard={this.state.borrowedCard}
          onClick={this.onCardRemoved}
          onBorrowedCardRemoved={this.onBorrowedCardRemoved}
          weights={this.state.weights}
        />
        <TierList
          cards={filterGlobalCards(cards)}
          weights={this.state.weights}
          selectedCards={this.state.selectedCards}
          cardSelected={this.onCardSelected}
          collection={this.state.collection}
          borrowedCard={this.state.borrowedCard}
          type={this.state.weights.type}
          onTypeChange={(type) =>
            this.setState({ weights: { ...this.state.weights, type } })
          }
        />
      </div>
    );
  }
}

export default App;
