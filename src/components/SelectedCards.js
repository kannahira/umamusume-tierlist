import React from 'react';
import SpeedIcon from '../icons/utx_ico_obtain_00.png';
import StaminaIcon from '../icons/utx_ico_obtain_01.png';
import PowerIcon from '../icons/utx_ico_obtain_02.png';
import GutsIcon from '../icons/utx_ico_obtain_03.png';
import WisdomIcon from '../icons/utx_ico_obtain_04.png';
import FriendIcon from '../icons/utx_ico_obtain_05.png';
import events from '../card-events';
import { processCards } from './TierList.js';

const raceRewards = [10, 8, 5];

const type_to_icon = [
  SpeedIcon,
  StaminaIcon,
  PowerIcon,
  GutsIcon,
  WisdomIcon,
  '',
  FriendIcon,
];

function SelectedCards(props) {
  let cards = [];
  let raceBonus = 0;
  let statsNoTraining = [120, 120, 120, 120, 120];

  // Process owned cards
  for (let i = 0; i < props.selectedCards.length; i++) {
    let lit_up = '';
    let dark = '';
    let card = props.selectedCards[i];
    raceBonus += card.race_bonus;

    for (let j = 0; j < 4; j++) {
      if (j < card.limit_break) {
        lit_up += '◆';
      } else {
        dark += '◆';
      }
    }

    for (let stat = 0; stat < 5; stat++) {
      if (events[card.id]) {
        statsNoTraining[stat] += events[card.id][stat] * card.effect_size_up;
      }
      statsNoTraining[stat] += card.starting_stats[stat];
    }

    cards.push(
      <div className="support-card" key={card.id + '-' + card.limit_break}>
        <img
          className="support-card-image"
          name={card.id}
          src={
            process.env.PUBLIC_URL +
            '/cardImages/support_card_s_' +
            card.id +
            '.png'
          }
          title={card.id}
          alt={card.id}
          onClick={() => props.onClick(card)}
        />
        <img
          className="type-icon"
          name="type icon"
          src={type_to_icon[card.type]}
          title="type"
          alt="card type"
          onClick={() => props.onClick(card)}
        />
        <span className="limit-breaks">
          <span className="lb-yes">{lit_up}</span>
          <span className="lb-no">{dark}</span>
        </span>
      </div>,
    );
  }

  // Process borrowed card if exists
  let borrowedCardElement = null;
  if (props.borrowedCard) {
    let lit_up = '◆◆◆◆'; // Always MLB
    let dark = '';
    let card = props.borrowedCard;
    raceBonus += card.race_bonus;

    for (let stat = 0; stat < 5; stat++) {
      if (events[card.id]) {
        statsNoTraining[stat] += events[card.id][stat] * card.effect_size_up;
      }
      statsNoTraining[stat] += card.starting_stats[stat];
    }

    borrowedCardElement = (
      <div className="support-card borrowed-card" key={card.id + '-borrowed'}>
        <img
          className="support-card-image"
          name={card.id}
          src={
            process.env.PUBLIC_URL +
            '/cardImages/support_card_s_' +
            card.id +
            '.png'
          }
          title={card.id}
          alt={card.id}
          onClick={() => props.onBorrowedCardRemoved(card)}
        />
        <img
          className="type-icon"
          name="type icon"
          src={type_to_icon[card.type]}
          title="type"
          alt="card type"
          onClick={() => props.onBorrowedCardRemoved(card)}
        />
        <span className="limit-breaks">
          <span className="lb-yes">{lit_up}</span>
          <span className="lb-no">{dark}</span>
        </span>
        <div className="borrowed-label">Borrowed</div>
      </div>
    );
  }

  let raceMultiplier = 1 + raceBonus / 100;
  for (let i = 0; i < 3; i++) {
    let raceGain = Math.floor(raceRewards[i] * raceMultiplier);
    raceGain = raceGain * props.weights.races[i];
    for (let stat = 0; stat < 5; stat++) {
      statsNoTraining[stat] += raceGain / 5;
    }
  }

  for (let stat = 0; stat < 5; stat++) {
    statsNoTraining[stat] += Math.floor(13.5 * raceMultiplier) * 3;
    statsNoTraining[stat] = Math.round(statsNoTraining[stat]);
  }

  console.log('Stat gains without training: ');
  console.log(statsNoTraining);

  // Calculate total deck score using processCards from TierList.js
  let totalScore = null;
  let statBreakdown = null;
  if (props.selectedCards.length + (props.borrowedCard ? 1 : 0) === 6) {
    // Build the 6-card deck
    const deck = props.selectedCards.slice();
    if (props.borrowedCard) deck.push(props.borrowedCard);
    // Use processCards to get the score for the borrowed card (if present), or the last card
    const processed = processCards(
      [deck[deck.length - 1]],
      props.weights,
      deck.slice(0, 5),
    );
    if (processed.length > 0) {
      totalScore = Math.round(processed[0].score);
      statBreakdown = processed[0].info.stat_scores;
    }
  }

  return (
    <div className="selected-cards">
      <div className="section-header">Support Deck</div>
      <div className="section-explanation">
        The cards you're using. Click one to remove it, and click one in the
        tier list to add it.
        <br />
        The score will consider the stats gained when training with these cards.
        <br />
        <strong>
          Note: The 6th card is borrowed from friends and will always be MLB.
        </strong>
      </div>
      <div className="cards-container">
        {cards}
        {borrowedCardElement && <div className="borrowed-separator"></div>}
        {borrowedCardElement}
      </div>
      <div>
        Total Race Bonus: <b>{raceBonus}</b>{' '}
        <i>(aim for 35 for URA/Aoharu, 50 for MANT)</i>
      </div>
      {totalScore !== null && (
        <div className="total-score">
          Total Score: <b>{totalScore}</b>
        </div>
      )}
      <div class="link">
        <a href={getEventHelperURL(props.selectedCards)} target="_blank">
          Open in Gametora Event Helper
        </a>
      </div>
    </div>
  );
}

function getEventHelperURL(selectedCards) {
  let url = 'https://gametora.com/umamusume/training-event-helper?deck=mp4y-';

  let ids = selectedCards.map((c) => c.id);
  while (ids.length < 6) ids.push(10000);

  url += parseInt(`${ids[0]}${ids[1]}${ids[2]}`, 10).toString(36);
  url += '-';
  url += parseInt(`${ids[3]}${ids[4]}${ids[5]}`, 10).toString(36);

  return url;
}

export default SelectedCards;
