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
    if (!isNaN(value) && value >= 0) setCardCount(value);
    else if (e.target.value === '') setCardCount(0);
  };
  
  const getRiskLevel = (prob) => {
    if (prob > 0.75) return { text: 'Safe Forest', color: COLORS.wood };
    if (prob > 0.50) return { text: 'Open Plains', color: COLORS.wheat };
    if (prob > 0.25) return { text: 'Mountain Pass', color: COLORS.brick };
    return { text: 'Desert Storm', color: '#b91c1c' };
  };

  const risk = getRiskLevel(metrics.survivalProbability);

  return (
    <div className="text-white min-h-screen font-sans p-3 sm:p-8 flex flex-col items-center select-none" style={{ backgroundColor: COLORS.darker }}>
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Calculator Section */}
        <header className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold mb-1 px-2" style={{ color: COLORS.wood }}>Catan Strategic Calculator</h1>
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
                className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg text-white text-center text-2xl focus:ring-2 focus:outline-none" 
                style={{ borderColor: COLORS.ore }} 
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
                <div className="flex flex-col sm:flex-row justify-around items-center">
                    <div className="w-full sm:w-1/2 p-2 sm:p-4">
                        <h2 className="text-md sm:text-xl opacity-70 mb-1">Survival Chance</h2>
                        <div className="text-5xl sm:text-6xl font-bold mb-2" style={{ color: COLORS.wheat }}>
                          {(metrics.survivalProbability * 100).toFixed(1)}%
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold" style={{ color: risk.color }}>{risk.text}</div>
                    </div>
                    <div className="w-full sm:w-px h-px sm:h-32 bg-gray-700 my-4 sm:my-0"></div>
                    <div className="w-full sm:w-1/2 p-2 sm:p-4">
                         <h2 className="text-md sm:text-xl opacity-70 mb-1">Expected Resources</h2>
                        <div className="text-5xl sm:text-6xl font-bold mb-2" style={{ color: COLORS.wheat }}>
                          {metrics.expectedCards.toFixed(2)}
                        </div>
                        <p className="text-gray-500 text-xs sm:text-sm">(If you don't bust)</p>
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

        {/* Thesis, Instructions, and Methodology Section */}
        <div className="max-w-4xl mx-auto bg-gray-800/30 p-6 sm:p-12 rounded-2xl border border-gray-700 shadow-xl leading-relaxed mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 border-b pb-4" style={{ color: COLORS.wood }}>Thesis, Instructions, and Methodology</h1>
          
          <section className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold mb-3" style={{ color: COLORS.wheat }}>I. Thesis: The Cost of Heuristic Risk Aversion</h2>
            <p className="text-gray-300 mb-4 text-sm sm:text-lg">
              In the competitive environment of <i>Settlers of Catan</i>, players frequently exhibit a systematic cognitive bias: the overestimation of "bust risk." This research posits that for a player starting with fewer than 8 cards, a "bust" is a complex compound event. By quantifying these paths, we demonstrate that <b>aggressive resource retention is frequently the mathematically dominant strategy.</b>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold mb-3" style={{ color: COLORS.wheat }}>II. Instructions for Use</h2>
            <div className="text-gray-300 space-y-4 text-sm sm:text-lg">
              <div className="flex gap-4">
                <span className="font-bold text-lg" style={{ color: COLORS.wood }}>1.</span>
                <p><b>Inventory Input:</b> Enter your current hand size at the beginning of the round.</p>
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

          <section className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold mb-3" style={{ color: COLORS.wheat }}>III. Methodology and Game Theory</h2>
            <div className="text-gray-300 space-y-6 text-sm sm:text-base">
              <p>The calculator utilizes a <b>Recursive State-Transition Model</b> to determine probability across a standard four-player round.</p>
              
              <div className="bg-black/20 p-4 rounded border border-gray-700">
                <h3 className="font-bold mb-2 text-white">The Compound Event Analysis</h3>
                <p className="mb-4 italic">For a player starting with S &lt; 8, a bust requires two distinct events:</p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  <li><b>Accumulation:</b> Rolls must hit your hexes to reach S ≥ 8.</li>
                  <li><b>The Strike:</b> A 7 must be rolled <i>after</i> reaching that state.</li>
                </ul>
                <div className="text-center font-mono py-2" style={{ color: COLORS.wheat }}>
                  P(A ∩ B) = P(Accumulate) × P(7)
                </div>
                <p className="mt-2 text-xs sm:text-sm">Since we multiply these independent probabilities, the result is exponentially lower than players often "feel" during gameplay.</p>
              </div>
            </div>
          </section>
        </div>
        
        <footer className="text-center text-gray-500 text-xs sm:text-sm pb-10">
            <p>© 2024 Catan Strategic Institute. Built for the long-term strategist.</p>
        </footer>
      </div>
    </div>
  );
}
