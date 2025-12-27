/**
 * stock-trader.js - PAI Stock Market Trading Bot
 * Agent: PAI-StockTrader
 *
 * Automated stock trading using TIX API.
 * Requires: TIX API Access ($200m) and optionally 4S Market Data ($1b+)
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();

    const AGENT = "PAI-StockTrader";
    const COMMISSION = 100000; // $100k per transaction
    const MIN_CASH_RESERVE = 10000000; // Keep $10m minimum
    const BUY_THRESHOLD = 0.6; // Buy if forecast > 60%
    const SELL_THRESHOLD = 0.5; // Sell if forecast < 50%
    const CYCLE_TIME = 6000; // 6 seconds (stock update cycle)

    // Check for TIX API access
    try {
        ns.stock.getSymbols();
    } catch (e) {
        ns.print(`[${AGENT}] ERROR: No TIX API access. Need to purchase it.`);
        ns.print(`[${AGENT}] INFO: TIX API costs ~$200m from the stock market`);
        ns.tprint(`[${AGENT}] Cannot run - no TIX API access`);
        return;
    }

    // Check for 4S data
    let has4S = false;
    try {
        const testSym = ns.stock.getSymbols()[0];
        ns.stock.getForecast(testSym);
        has4S = true;
        ns.print(`[${AGENT}] INFO: 4S Market Data available - using forecasts`);
    } catch (e) {
        ns.print(`[${AGENT}] WARN: No 4S data - using price momentum strategy`);
    }

    const symbols = ns.stock.getSymbols();
    let totalProfit = 0;
    let trades = 0;
    const positions = {}; // Track our positions

    ns.print("═".repeat(60));
    ns.print(`[${AGENT}] PURPOSE: Generate profit through stock trading`);
    ns.print(`[${AGENT}] STRATEGY: ${has4S ? "Forecast-based" : "Momentum-based"}`);
    ns.print(`[${AGENT}] SYMBOLS: ${symbols.length} stocks available`);
    ns.print("═".repeat(60));

    while (true) {
        const portfolio = [];
        const opportunities = [];
        let portfolioValue = 0;

        for (const sym of symbols) {
            const pos = ns.stock.getPosition(sym);
            const shares = pos[0];
            const avgPrice = pos[1];
            const price = ns.stock.getPrice(sym);

            if (shares > 0) {
                const value = shares * price;
                const profit = (price - avgPrice) * shares;
                portfolioValue += value;
                portfolio.push({ sym, shares, avgPrice, price, value, profit });
                positions[sym] = { shares, avgPrice };
            }

            // Get forecast if available
            let forecast = 0.5;
            let volatility = 0;
            if (has4S) {
                forecast = ns.stock.getForecast(sym);
                volatility = ns.stock.getVolatility(sym);
            }

            const maxShares = ns.stock.getMaxShares(sym);
            const askPrice = ns.stock.getAskPrice(sym);
            const bidPrice = ns.stock.getBidPrice(sym);

            opportunities.push({
                sym,
                price,
                askPrice,
                bidPrice,
                forecast,
                volatility,
                maxShares,
                owned: shares,
                score: (forecast - 0.5) * volatility * 100
            });
        }

        // === SELL LOGIC ===
        for (const stock of portfolio) {
            const opp = opportunities.find(o => o.sym === stock.sym);
            const shouldSell = has4S
                ? opp.forecast < SELL_THRESHOLD
                : stock.profit > stock.value * 0.05; // 5% profit target without 4S

            if (shouldSell) {
                const saleValue = ns.stock.sellStock(stock.sym, stock.shares);
                if (saleValue > 0) {
                    const profit = saleValue - (stock.shares * stock.avgPrice) - COMMISSION;
                    totalProfit += profit;
                    trades++;
                    ns.print(`[${AGENT}] PURPOSE: Lock in profits on ${stock.sym}`);
                    ns.print(`[${AGENT}] ACTION: SELL ${ns.formatNumber(stock.shares)} shares @ $${ns.formatNumber(stock.price)}`);
                    ns.print(`[${AGENT}] RESULT: ${profit >= 0 ? "PROFIT" : "LOSS"} $${ns.formatNumber(Math.abs(profit))}`);
                    delete positions[stock.sym];
                }
            }
        }

        // === BUY LOGIC ===
        const cash = ns.getServerMoneyAvailable("home");
        const availableCash = cash - MIN_CASH_RESERVE;

        if (availableCash > COMMISSION * 10) {
            // Sort by best opportunity
            const buyOpps = opportunities
                .filter(o => (has4S ? o.forecast > BUY_THRESHOLD : o.score > 0))
                .filter(o => o.owned < o.maxShares)
                .sort((a, b) => b.forecast - a.forecast);

            for (const opp of buyOpps.slice(0, 3)) { // Buy up to 3 stocks per cycle
                const maxAfford = Math.floor((availableCash * 0.25) / opp.askPrice);
                const maxAvailable = opp.maxShares - opp.owned;
                const sharesToBuy = Math.min(maxAfford, maxAvailable);

                if (sharesToBuy > 0 && sharesToBuy * opp.askPrice > COMMISSION * 2) {
                    const cost = ns.stock.buyStock(opp.sym, sharesToBuy);
                    if (cost > 0) {
                        trades++;
                        ns.print(`[${AGENT}] PURPOSE: Invest in ${opp.sym} (forecast: ${(opp.forecast * 100).toFixed(1)}%)`);
                        ns.print(`[${AGENT}] ACTION: BUY ${ns.formatNumber(sharesToBuy)} shares @ $${ns.formatNumber(opp.askPrice)}`);
                        ns.print(`[${AGENT}] RESULT: Invested $${ns.formatNumber(cost)}`);
                    }
                }
            }
        }

        // === STATUS REPORT ===
        ns.clearLog();
        ns.print("═".repeat(60));
        ns.print(`  [${AGENT}] STOCK TRADING BOT`);
        ns.print("═".repeat(60));
        ns.print("");
        ns.print(`  Cash:          $${ns.formatNumber(cash)}`);
        ns.print(`  Portfolio:     $${ns.formatNumber(portfolioValue)}`);
        ns.print(`  Total Profit:  $${ns.formatNumber(totalProfit)}`);
        ns.print(`  Trades:        ${trades}`);
        ns.print("");
        ns.print(`  ┌─ HOLDINGS ─────────────────────────────────────────┐`);
        if (portfolio.length === 0) {
            ns.print(`  │ No positions                                       │`);
        } else {
            for (const p of portfolio.slice(0, 5)) {
                const profitPct = ((p.price / p.avgPrice - 1) * 100).toFixed(1);
                const sign = p.profit >= 0 ? "+" : "";
                ns.print(`  │ ${p.sym.padEnd(6)} ${ns.formatNumber(p.shares).padEnd(10)} ${sign}${profitPct}% ($${ns.formatNumber(p.profit)})`.padEnd(56) + "│");
            }
            if (portfolio.length > 5) {
                ns.print(`  │ ... and ${portfolio.length - 5} more positions`.padEnd(56) + "│");
            }
        }
        ns.print(`  └─────────────────────────────────────────────────────┘`);

        if (has4S) {
            ns.print("");
            ns.print(`  ┌─ TOP OPPORTUNITIES ───────────────────────────────┐`);
            const top = opportunities.sort((a, b) => b.forecast - a.forecast).slice(0, 3);
            for (const o of top) {
                ns.print(`  │ ${o.sym.padEnd(6)} Forecast: ${(o.forecast * 100).toFixed(1)}%`.padEnd(56) + "│");
            }
            ns.print(`  └─────────────────────────────────────────────────────┘`);
        }

        ns.print("═".repeat(60));

        await ns.sleep(CYCLE_TIME);
    }
}
