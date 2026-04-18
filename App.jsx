import React, { useState, useMemo } from 'react';

// --- Colors from the Game Palette ---
const COLORS = {
  ore: '#7b6f83',    // Grey
  brick: '#9c4300',  // Brown
  ocean: '#4fa6eb',  // Blue
  wood: '#517d19',   // Green
  wheat: '#f0ad00',  // Yellow
  darker: '#0a0f1a'  // Dark background
};

// --- Helper Data & Functions ---
const DICE_ROLL_PROBABILITY = {
  2: 1 / 36, 3: 2 / 36, 4: 3 / 36, 5: 4 / 36, 6: 5 / 36, 7: 6 / 36,
  8: 5 / 36, 9: 4 / 36, 10: 3 / 36, 11: 2 / 36, 12: 1 / 36,
};
const ALL_ROLLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TOTAL_ROLLS_TO_CONSIDER = 4;

// --- Components ---
const NumberButton = ({ number, onToggle, production, isSelected }) => {
  const prob = (DICE_ROLL_PROBABILITY[number] * 100).toFixed(2);
  const pips = 6 - Math.abs(7 - number);

  return (
    <div
      onClick={() => onToggle(number)}
      style={{
        backgroundColor: isSelected ? COLORS.brick : 'white',
        color: isSelected ? 'white' : '#1f2937',
        border: isSelected ? `2px solid ${COLORS.wheat}` : '2px solid transparent'
      }}
      className="relative flex flex-col items-center justify-center w-20 h-20 xs:w-24 xs:h-24 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer select-none"
      role="button"
      tabIndex="0"
    >
      <span className="absolute top-1 right-1.5 text-[10px] sm:text-xs opacity-60">{prob}%</span>
      <span className="text-2xl sm:text-3xl font-bold">{number}</span>
      <div className="flex" style={{ color: isSelected ? COLORS.wheat : COLORS.brick }}>
        {Array.from({ length: pips }).map((_, i) => (
          <span key={i} className="text-[10px] sm:text-xs mx-px">●</span>
        ))}
      </div>
      {isSelected && (
        <div className="absolute -bottom-3 flex items-center px-2 py-1 rounded-full text-xs shadow-lg z-10" style={{ backgroundColor: COLORS.wood }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(number, -1); }} 
            className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center font-bold text-white text-lg"
          >-</button>
          <span className="mx-2 font-bold text-white text-sm">{production}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(number, 1); }} 
            className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center font-bold text-white text-lg"
          >+</button>
        </div>
      )}
    </div>
  );
};

// Main App Component
export default function App() {
  const [cardCount, setCardCount] = useState(5);
  const [productionNumbers, setProductionNumbers] = useState({});

  const metrics = useMemo(() => {
    const memo = {}; 
    const getResourcesGained = (roll) => productionNumbers[roll] || 0;

    const calculateStateDistribution = (currentCards, rollsRemaining) => {
      if (rollsRemaining === 0) return { [currentCards]: 1 };
      const memoKey = `${currentCards}-${rollsRemaining}`;
      if (memo[memoKey]) return memo[memoKey];

      let finalDistribution = {};
      for (const roll of ALL_ROLLS) {
        const rollProb = DICE_ROLL_PROBABILITY[roll];
        let nextCardCount = currentCards;
        let isBust = false;

        if (roll === 7 && currentCards > 7) {
          isBust = true;
        } else if (roll !== 7) {
          nextCardCount += getResourcesGained(roll);
        }
        
        if (isBust) continue;

        const subsequentDistribution = calculateStateDistribution(nextCardCount, rollsRemaining - 1);
        for (const [finalCount, prob] of Object.entries(subsequentDistribution)) {
            finalDistribution[finalCount] = (finalDistribution[finalCount] || 0) + rollProb * prob;
        }
      }
      memo[memoKey] = finalDistribution;
      return finalDistribution;
    };

    const distribution = calculateStateDistribution(cardCount, TOTAL_ROLLS_TO_CONSIDER);
    let survivalProbability = 0;
    let weightedExpectedCards = 0;

    for (const [count, prob] of Object.entries(distribution)) {
      survivalProbability += prob;
      weightedExpectedCards += parseInt(count, 10) * prob;
    }

    const expectedCards = survivalProbability > 0 ? weightedExpectedCards / survivalProbability : 0;
    return { survivalProbability, expectedCards };
  }, [cardCount, productionNumbers]);

  const handleToggleNumber = (number, change = 1) => {
    setProductionNumbers(prev => {
      const newProd = { ...prev };
      const currentVal = newProd[number] || 0;
      const newVal = currentVal + change;
      if (newVal > 0) newProd[number] = newVal;
      else delete newProd[number];
      return newProd;
    });
  };

  const handleCardCountChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) setCardCount(Math.max(0, value));
    else if (e.target.value === '') setCardCount(0);
  };

  const displaySurvival = useMemo(() => {
    if (metrics.survivalProbability >= 1) return '100%';
    return (metrics.survivalProbability * 100).toFixed(1) + '%';
  }, [metrics.survivalProbability]);

  return (
    <div className="text-white min-h-screen font-sans p-3 sm:p-8 flex flex-col items-center select-none" style={{ backgroundColor: COLORS.darker }}>
      <style>{`
        /* Custom styling for high-contrast gold arrows */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          filter: invert(74%) sepia(95%) saturate(1838%) hue-rotate(352deg) brightness(101%) contrast(101%);
          opacity: 1;
          cursor: pointer;
          height: 32px;
        }
      `}</style>
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Calculator Section */}
        <header className="text-center mb-6 sm:mb-10">
          <h1 className="text-4xl sm:text-7xl font-bold mb-1 px-2" style={{ color: COLORS.wheat }}>CatanCalculator.io</h1>
          <p className="text-sm sm:text-lg opacity-70">Will you survive the next full round?</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-12 sm:mb-20">
          {/* Inventory Sidebar */}
          <div className="lg:col-span-1 bg-gray-800/50 p-5 sm:p-6 rounded-xl shadow-2xl flex flex-col border-t-4" style={{ borderColor: COLORS.brick }}>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 border-b pb-2" style={{ borderColor: COLORS.ore }}>Your Inventory</h2>
            <div className="mb-6">
              <label htmlFor="card-count" className="block text-md sm:text-lg font-medium text-gray-300 mb-2">Cards in Hand</label>
              <input 
                id="card-count" 
                type="number" 
                inputMode="numeric"
                value={cardCount} 
                onChange={handleCardCountChange} 
                className="w-full h-14 bg-gray-900 rounded-lg text-center text-3xl font-bold focus:ring-2 focus:outline-none transition-colors" 
                style={{ border: `2px solid ${COLORS.ore}`, color: COLORS.wheat }} 
                min="0"
              />
            </div>
            <div className="flex-grow">
              <h3 className="text-md sm:text-lg font-medium text-gray-300 mb-2">Active Production:</h3>
              <div className="bg-gray-900/50 p-3 rounded-lg min-h-[80px] border border-dashed flex flex-wrap gap-2 content-start" style={{ borderColor: COLORS.ore }}>
                {Object.keys(productionNumbers).length > 0 ? (
                  Object.entries(productionNumbers).map(([num, prod]) => (
                    <div key={num} className="px-3 py-1 rounded-md text-xs sm:text-sm font-bold" style={{ backgroundColor: COLORS.brick, color: COLORS.wheat }}>
                      {num} ({prod}x)
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center italic w-full pt-4 text-sm">Select hexes below.</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-2 bg-gray-800/50 p-5 sm:p-6 rounded-xl shadow-2xl border-t-4" style={{ borderColor: COLORS.wood }}>
            <div className="bg-gray-900 p-4 sm:p-6 rounded-lg mb-6 text-center shadow-inner border" style={{ borderColor: COLORS.ore }}>
                <div className="flex flex-col sm:flex-row justify-between items-center px-2 space-y-4 sm:space-y-0">
                    <div className="flex-1 p-2 text-center min-w-0">
                        <h2 className="text-xs sm:text-xl opacity-70 mb-1 whitespace-nowrap">Survival Chance</h2>
                        <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold truncate" style={{ color: COLORS.wheat }}>
                          {displaySurvival}
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-32 bg-gray-700 opacity-50 mx-4"></div>
                    <div className="block sm:hidden w-full h-px bg-gray-700 opacity-30"></div>
                    <div className="flex-1 p-2 text-center min-w-0">
                         <h2 className="text-xs sm:text-xl opacity-70 mb-1 whitespace-nowrap">Expected Resources</h2>
                        <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold truncate" style={{ color: COLORS.wheat }}>
                          {metrics.expectedCards.toFixed(2)}
                        </div>
                        <p className="text-gray-500 text-[10px] sm:text-sm mt-1 whitespace-nowrap">(If you don't bust)</p>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center" style={{ color: COLORS.ore }}>Select Production Numbers</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 justify-items-center">
                {ALL_ROLLS.filter(n => n !== 7).map(number => (
                    <NumberButton 
                      key={number} 
                      number={number} 
                      onToggle={handleToggleNumber} 
                      production={productionNumbers[number] || 0} 
                      isSelected={!!productionNumbers[number]}
                    />
                ))}
                </div>
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="max-w-4xl mx-auto bg-gray-800/30 p-6 sm:p-12 rounded-2xl border border-gray-700 shadow-xl leading-relaxed mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 border-b pb-4" style={{ color: COLORS.wood }}>Thesis, Instructions, and Methodology</h1>
          
          {/* I. Thesis */}
          <section className="mb-12">
            <h2 className="text-lg sm:text-xl font-bold mb-4" style={{ color: COLORS.wheat }}>I. Thesis</h2>
            <p className="text-gray-300 text-sm sm:text-lg italic">
              In the competitive environment of Settlers of Catan, players frequently exhibit a systematic cognitive bias: the overestimation of "bust risk" (rolling a 7 with 8+ cards). The hypothesis is that for a player starting a round with fewer than 8 cards, a "bust" is a complex compound event requiring a specific sequence of independent rolls. As such, the average player overstates the probability of its occurrence and does not “risk it” enough. This calculator hopes to quantifying these paths and demonstrate that aggressive resource retention is frequently the mathematically dominant strategy.
            </p>
          </section>

          {/* II. Instructions */}
          <section className="mb-12">
            <h2 className="text-lg sm:text-xl font-bold mb-4" style={{ color: COLORS.wheat }}>II. Instructions for Use</h2>
            <div className="text-gray-300 space-y-4 text-sm sm:text-lg">
              <div className="flex gap-4">
                <span className="font-bold text-lg" style={{ color: COLORS.wood }}>1.</span>
                <p><b>Inventory Input:</b> Enter your current hand size at the beginning of the round using the input field.</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-lg" style={{ color: COLORS.wood }}>2.</span>
                <p><b>Production Selection:</b> Select every hex where you have a settlement or city. Use the `+` for multiple settlements/cities on one number.</p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-lg" style={{ color: COLORS.wood }}>3.</span>
                <p><b>Risk Assessment:</b> Use the percentage to decide whether to trade or hold for your next turn.</p>
              </div>
            </div>
          </section>

          {/* III. Methodology */}
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-6" style={{ color: COLORS.wheat }}>III. Methodology and Game Theory</h2>
            <div className="text-gray-300 space-y-12 text-sm sm:text-base">
              
              {/* Methodology Item 1 */}
              <div>
                <h3 className="font-bold mb-3 text-white text-lg underline decoration-wood underline-offset-4">1. The Probability of the Trigger Event</h3>
                <p className="mb-4">The probability of a single dice roll X resulting in a value n is defined by:</p>
                <div className="bg-black/40 p-5 text-center font-mono rounded-lg text-lg border border-gray-700" style={{ color: COLORS.wheat }}>
                  P(X=n) = (6 - |7-n|) / 36
                </div>
                <p className="mt-4">The probability of a "7" is 1/6 (16.67%). However, this is only a catastrophic threat if the player's state S is already ≥ 8. In a risk-neutral environment, the player should only consider the "bust cost" relative to the "potential gain" of the held cards.</p>
              </div>

              {/* Methodology Item 2 (Merged) */}
              <div>
                <h3 className="font-bold mb-3 text-white text-lg underline decoration-wood underline-offset-4">2. The Compound Event Analysis</h3>
                <p className="mb-4 leading-relaxed">
                  For a player starting with S &lt; 8, a bust requires a sequence of two independent events: Accumulation (reaching S ≥ 8) and The Strike (a 7 being rolled subsequent to accumulation). The calculator evaluates every possible outcome across a full round. In a 4-roll sequence where each roll has 11 possible outcomes, the engine considers all 1,679,616 unique timelines.
                </p>
                <div className="bg-black/40 p-5 text-center font-mono rounded-lg text-xl border border-gray-700" style={{ color: COLORS.wheat }}>
                  Chance of Bust = (Prob. of reaching 8+ cards) × (Prob. of rolling a 7)
                </div>
              </div>

              {/* Methodology Item 3 */}
              <div>
                <h3 className="font-bold mb-3 text-white text-lg underline decoration-wood underline-offset-4">3. Window of Failure</h3>
                <p className="mb-4 leading-relaxed">
                  The "Window of Failure" is further narrowed by the finite number of rolls in a round. In a 4-player game, there are only 4 trials (k=4). If Event A occurs on roll k=3, there is only one remaining trial for Event B to trigger a bust. If Event A occurs on the final roll of the round, the probability of a bust within that round is zero, as there are no subsequent opponent rolls to trigger the 7.
                </p>
              </div>

              {/* Methodology Item 4 */}
              <div>
                <h3 className="font-bold mb-3 text-white text-lg underline decoration-wood underline-offset-4">4. Risk-Neutral Utility Strategy</h3>
                <p className="mb-4 leading-relaxed">
                  Strategic dominance in Catan is found by maximizing the Expected Value (EV) of your hand. Most players optimize for variance reduction (avoiding the "pain" of a bust) rather than EV maximization. In a 4-player competitive environment, the threshold for victory is substantially higher than in head-to-head play. Because you must outpace three other independent production engines, playing for "safety" is often synonymous with playing for second place. Success requires capturing high-upside distributions, even when they carry calculated risk.
                </p>
              </div>

            </div>
          </section>
        </div>
        
        <footer className="text-center text-gray-500 text-xs sm:text-sm pb-10">
            <p>© 2026 CatanCalculator.io. Built for the long-term strategist.</p>
        </footer>
      </div>
    </div>
  );
}
