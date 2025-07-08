import React from 'react';
import SupportCard from './SupportCard';
import cards from '../cards';
import {
  GLOBAL_LATEST_R_ID,
  GLOBAL_LATEST_SR_ID,
  GLOBAL_LATEST_SSR_ID,
} from '../constants';
import rarityR from '../icons/utx_txt_rarity_01.png';
import raritySR from '../icons/utx_txt_rarity_02.png';
import raritySSR from '../icons/utx_txt_rarity_03.png';
import type0 from '../icons/utx_ico_obtain_00.png';
import type1 from '../icons/utx_ico_obtain_01.png';
import type2 from '../icons/utx_ico_obtain_02.png';
import type3 from '../icons/utx_ico_obtain_03.png';
import type4 from '../icons/utx_ico_obtain_04.png';
import type5 from '../icons/utx_ico_obtain_05.png';

// Use existing icons - type5 will be used for both Group and Friend types
const typeIcons = [type0, type1, type2, type3, type4, type5];
const typeNames = [
  'Speed',
  'Stamina',
  'Power',
  'Guts',
  'Wisdom',
  'Group/Friend',
];
const rarityIcons = [null, rarityR, raritySR, raritySSR];
const rarityNames = ['', 'R', 'SR', 'SSR'];

// Helper to filter cards for global
function filterGlobalCards(cardList) {
  return cardList.filter((card) => {
    if (card.rarity === 1) return card.id <= GLOBAL_LATEST_R_ID;
    if (card.rarity === 2) return card.id <= GLOBAL_LATEST_SR_ID;
    if (card.rarity === 3) return card.id <= GLOBAL_LATEST_SSR_ID;
    return false;
  });
}

class CollectionManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      selectedType: -1,
      selectedRarity: -1,
    };

    this.toggleShow = this.toggleShow.bind(this);
    this.onTypeChange = this.onTypeChange.bind(this);
    this.onRarityChange = this.onRarityChange.bind(this);
    this.toggleCardOwnership = this.toggleCardOwnership.bind(this);
    this.clearAll = this.clearAll.bind(this);
    this.selectAll = this.selectAll.bind(this);
  }

  toggleShow() {
    this.setState((prevState) => ({ show: !prevState.show }));
  }

  onTypeChange(event) {
    this.setState({ selectedType: parseInt(event.target.value) });
  }

  onRarityChange(event) {
    this.setState({ selectedRarity: parseInt(event.target.value) });
  }

  toggleCardOwnership(cardId, limitBreak) {
    // Remove all other limit breaks for this card from the collection
    const newCollection = new Set(this.props.collection);
    for (let lb = 0; lb <= 4; lb++) {
      newCollection.delete(`${cardId}_${lb}`);
    }
    // Add the selected limit break
    newCollection.add(`${cardId}_${limitBreak}`);
    // Call the parent handler with the new collection
    if (this.props.onCollectionChange) {
      this.props.onCollectionChange(cardId, limitBreak, newCollection);
    }
  }

  clearAll() {
    this.props.onClearCollection();
  }

  selectAll() {
    // Only select lb4 for each card
    const allCards = new Set();
    const seen = new Set();
    const globalCards = filterGlobalCards(cards);
    globalCards.forEach((card) => {
      if (!seen.has(card.id) && card.limit_break === 4) {
        allCards.add(`${card.id}_4`);
        seen.add(card.id);
      }
    });
    this.props.onClearCollection(); // Clear first to avoid duplicates
    this.props.onSelectAll && this.props.onSelectAll(allCards);
    // If onSelectAll is not customized, fallback to onCollectionChange
    if (!this.props.onSelectAll) {
      allCards.forEach((key) => {
        const [id, lb] = key.split('_');
        this.props.onCollectionChange(Number(id), Number(lb), allCards);
      });
    }
  }

  render() {
    try {
      if (!this.state.show) {
        return (
          <div className="collection-manager">
            <button onClick={this.toggleShow} className="btn btn-primary">
              Manage Collection (
              {this.props.collection ? this.props.collection.size : 0} cards
              owned)
            </button>
          </div>
        );
      }

      // Filter cards for global server first, then apply search and filters
      let filteredCards = filterGlobalCards(cards).filter((card) => {
        // Type filter
        if (
          this.state.selectedType !== -1 &&
          card.type !== this.state.selectedType &&
          !(
            this.state.selectedType === 5 &&
            (card.type === 6 || card.type === 7)
          )
        ) {
          return false;
        }

        // Rarity filter
        if (
          this.state.selectedRarity !== -1 &&
          card.rarity !== this.state.selectedRarity
        ) {
          return false;
        }

        return true;
      });

      // Sort cards: SSR first, then SR, then R, and within each rarity by ID (newest first)
      filteredCards.sort((a, b) => {
        // First sort by rarity (3=SSR, 2=SR, 1=R)
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity; // Higher rarity first
        }
        // Within same rarity, sort by ID (highest first = newest)
        return b.id - a.id;
      });

      // Group cards by ID to show one entry per character
      const cardGroups = {};
      filteredCards.forEach((card) => {
        if (!cardGroups[card.id]) {
          cardGroups[card.id] = [];
        }
        cardGroups[card.id].push(card);
      });

      // Sort the card groups by rarity (SSR first) and then by ID (newest first)
      const sortedCardEntries = Object.entries(cardGroups).sort(
        ([idA, variantsA], [idB, variantsB]) => {
          const cardA = variantsA[0];
          const cardB = variantsB[0];

          // First sort by rarity (3=SSR, 2=SR, 1=R)
          if (cardA.rarity !== cardB.rarity) {
            return cardB.rarity - cardA.rarity; // Higher rarity first
          }
          // Within same rarity, sort by ID (highest first = newest)
          return cardB.id - cardA.id;
        },
      );

      return (
        <div className="collection-manager">
          <div className="collection-header">
            <h3>Manage Your Collection</h3>
          </div>

          <div className="collection-controls">
            <div className="filter-controls">
              <div className="filters_sort_row">
                {typeIcons.map((icon, idx) => (
                  <div key={idx} className="filters_checkbox_div_image">
                    <input
                      type="checkbox"
                      className="filters_hide"
                      id={`type-${idx}`}
                      checked={
                        this.state.selectedType === idx ||
                        this.state.selectedType === -1
                      }
                      onChange={() =>
                        this.setState({
                          selectedType:
                            this.state.selectedType === idx ? -1 : idx,
                        })
                      }
                    />
                    <label
                      htmlFor={`type-${idx}`}
                      className="filters_icon_inactive"
                    >
                      <span
                        style={{
                          maxWidth: '32px',
                          maxHeight: '32px',
                          display: 'inline-block',
                          filter:
                            this.state.selectedType === idx ||
                            this.state.selectedType === -1
                              ? 'none'
                              : 'grayscale(1) brightness(0.7)',
                        }}
                      >
                        <img
                          src={icon}
                          alt={typeNames[idx]}
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                          title={typeNames[idx]}
                        />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="filters_sort_row">
                {[1, 2, 3].map((rarity) => (
                  <div key={rarity} className="filters_checkbox_div_image">
                    <input
                      type="checkbox"
                      className="filters_hide"
                      id={`rarity-${rarity}`}
                      checked={
                        this.state.selectedRarity === rarity ||
                        this.state.selectedRarity === -1
                      }
                      onChange={() =>
                        this.setState({
                          selectedRarity:
                            this.state.selectedRarity === rarity ? -1 : rarity,
                        })
                      }
                    />
                    <label
                      htmlFor={`rarity-${rarity}`}
                      className="filters_icon_inactive"
                    >
                      <span
                        style={{
                          maxWidth: '53px',
                          maxHeight: '22px',
                          display: 'inline-block',
                          filter:
                            this.state.selectedRarity === rarity ||
                            this.state.selectedRarity === -1
                              ? 'none'
                              : 'grayscale(1) brightness(0.7)',
                        }}
                      >
                        <img
                          src={rarityIcons[rarity]}
                          alt={rarityNames[rarity]}
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                          title={rarityNames[rarity]}
                        />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bulk-actions">
              <button onClick={this.selectAll} className="btn btn-success">
                Select All
              </button>
              <button onClick={this.clearAll} className="btn btn-danger">
                Select None
              </button>
              <button onClick={this.toggleShow} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>

          <div className="collection-stats">
            <span>Showing {Object.keys(cardGroups).length} cards</span>
            <span>
              Owned: {this.props.collection ? this.props.collection.size : 0}{' '}
              cards
            </span>
          </div>

          <div className="collection-grid">
            {sortedCardEntries.map(([cardId, cardVariants]) => {
              const baseCard = cardVariants[0];
              const ownedLimitBreaks = cardVariants
                .filter((card) =>
                  this.props.collection.has(`${card.id}_${card.limit_break}`),
                )
                .map((card) => card.limit_break);

              return (
                <div key={cardId} className="collection-card-entry">
                  <div className="card-info">
                    <SupportCard
                      id={baseCard.id}
                      lb={
                        ownedLimitBreaks.length > 0
                          ? Math.max(...ownedLimitBreaks)
                          : 0
                      }
                      score={0}
                      info={{}}
                      charName={baseCard.char_name}
                      selected={[]}
                      card={baseCard}
                      onClick={() => {}}
                      stats={['none', 'none', 'none']}
                      showOwnership={true}
                      ownedLimitBreaks={ownedLimitBreaks}
                      hideScore={true}
                    />
                  </div>

                  <div className="limit-break-selector">
                    {cardVariants.map((card) => {
                      const isOwned = this.props.collection.has(
                        `${card.id}_${card.limit_break}`,
                      );
                      return (
                        <button
                          key={`${card.id}_${card.limit_break}`}
                          className={`lb-chip${isOwned ? ' selected' : ''}`}
                          style={{
                            marginRight: '6px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isOwned
                              ? '2px solid #007bff'
                              : '1px solid #ccc',
                            background: isOwned ? '#e3f0ff' : '#f8f9fa',
                            color: isOwned ? '#007bff' : '#333',
                            fontWeight: isOwned ? 'bold' : 'normal',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            this.toggleCardOwnership(card.id, card.limit_break)
                          }
                          disabled={isOwned}
                        >
                          {card.limit_break}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error in CollectionManager render:', error);
      return (
        <div className="collection-manager">
          <div className="collection-header">
            <h3>Error Loading Collection Manager</h3>
            <button onClick={this.toggleShow} className="btn btn-secondary">
              Close
            </button>
          </div>
          <p>
            There was an error loading the collection manager. Please try
            refreshing the page.
          </p>
        </div>
      );
    }
  }
}

export default CollectionManager;
