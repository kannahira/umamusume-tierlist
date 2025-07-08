import React from 'react';
import SupportCard from './SupportCard';
import cards from '../cards';

class CollectionManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      searchTerm: '',
      selectedType: -1,
      selectedRarity: -1,
    };

    this.toggleShow = this.toggleShow.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onTypeChange = this.onTypeChange.bind(this);
    this.onRarityChange = this.onRarityChange.bind(this);
    this.toggleCardOwnership = this.toggleCardOwnership.bind(this);
    this.clearAll = this.clearAll.bind(this);
    this.selectAll = this.selectAll.bind(this);
  }

  toggleShow() {
    this.setState((prevState) => ({ show: !prevState.show }));
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  onTypeChange(event) {
    this.setState({ selectedType: parseInt(event.target.value) });
  }

  onRarityChange(event) {
    this.setState({ selectedRarity: parseInt(event.target.value) });
  }

  toggleCardOwnership(cardId, limitBreak) {
    this.props.onCollectionChange(cardId, limitBreak);
  }

  clearAll() {
    this.props.onClearCollection();
  }

  selectAll() {
    this.props.onSelectAll();
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

      // Filter cards based on search and filters
      let filteredCards = cards.filter((card) => {
        // Search filter
        if (
          this.state.searchTerm &&
          !card.char_name
            .toLowerCase()
            .includes(this.state.searchTerm.toLowerCase())
        ) {
          return false;
        }

        // Type filter
        if (
          this.state.selectedType !== -1 &&
          card.type !== this.state.selectedType
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

      // Group cards by ID to show one entry per character
      const cardGroups = {};
      filteredCards.forEach((card) => {
        if (!cardGroups[card.id]) {
          cardGroups[card.id] = [];
        }
        cardGroups[card.id].push(card);
      });

      const typeNames = [
        'Speed',
        'Stamina',
        'Power',
        'Guts',
        'Wisdom',
        '',
        'Friend',
      ];
      const rarityNames = ['', 'R', 'SR', 'SSR'];

      return (
        <div className="collection-manager">
          <div className="collection-header">
            <h3>Manage Your Collection</h3>
            <button onClick={this.toggleShow} className="btn btn-secondary">
              Close
            </button>
          </div>

          <div className="collection-controls">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search by character name..."
                value={this.state.searchTerm}
                onChange={this.onSearchChange}
                className="form-control"
              />
            </div>

            <div className="filter-controls">
              <select
                value={this.state.selectedType}
                onChange={this.onTypeChange}
                className="form-control"
              >
                <option value={-1}>All Types</option>
                {typeNames.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={this.state.selectedRarity}
                onChange={this.onRarityChange}
                className="form-control"
              >
                <option value={-1}>All Rarities</option>
                {rarityNames.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bulk-actions">
              <button onClick={this.selectAll} className="btn btn-success">
                Select All
              </button>
              <button onClick={this.clearAll} className="btn btn-danger">
                Clear All
              </button>
            </div>
          </div>

          <div className="collection-stats">
            <span>Showing {Object.keys(cardGroups).length} characters</span>
            <span>
              Owned: {this.props.collection ? this.props.collection.size : 0}{' '}
              cards
            </span>
          </div>

          <div className="collection-grid">
            {Object.entries(cardGroups).map(([cardId, cardVariants]) => {
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
                    />
                    <div className="card-name">{baseCard.char_name}</div>
                    <div className="card-type">
                      {typeNames[baseCard.type]} {rarityNames[baseCard.rarity]}
                    </div>
                  </div>

                  <div className="limit-break-selector">
                    {cardVariants.map((card) => {
                      const isOwned = this.props.collection.has(
                        `${card.id}_${card.limit_break}`,
                      );
                      return (
                        <button
                          key={`${card.id}_${card.limit_break}`}
                          className={`lb-toggle ${
                            isOwned ? 'owned' : 'not-owned'
                          }`}
                          onClick={() =>
                            this.toggleCardOwnership(card.id, card.limit_break)
                          }
                          title={`Limit Break ${card.limit_break}`}
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
