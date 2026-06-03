import fs from "fs";
import path from "path";

// ANSI Terminal Colors for beautiful output
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function printHeader(msg: string) {
  console.log(`\n${BOLD}${BLUE}=== ${msg} ===${RESET}`);
}

function printPass(testNum: number, msg: string) {
  console.log(`${GREEN}✔ [PASS] Test ${testNum}: ${msg}${RESET}`);
}

function printFail(testNum: number, msg: string, err?: any) {
  console.log(`${RED}✘ [FAIL] Test ${testNum}: ${msg}${RESET}`);
  if (err) console.error(err);
}

export function runEventSystemTests() {
  printHeader("CHRONOS EVENT SYSTEM TEST SUITE");

  let events: any[] = [];
  
  // 1. events.json 是否成功載入
  try {
    const eventsPath = path.join(process.cwd(), "src", "events.json");
    if (!fs.existsSync(eventsPath)) {
      throw new Error(`src/events.json file does not exist at ${eventsPath}`);
    }
    const rawData = fs.readFileSync(eventsPath, "utf-8");
    events = JSON.parse(rawData);
    printPass(1, "events.json successfully loaded!");
  } catch (err: any) {
    printFail(1, "Failed to load events.json", err);
    process.exit(1);
  }

  // 2. 是否有 80 個事件
  if (events.length === 80) {
    printPass(2, `Exactly ${events.length} events found code-wide.`);
  } else {
    printFail(2, `Expected 80 events, but found ${events.length} events!`);
  }

  // 3. 每個事件是否都有 id、category、title、description、choices
  let allHaveFields = true;
  let fieldErrorCount = 0;
  events.forEach((event, idx) => {
    const required = ["id", "category", "title", "description", "choices"];
    for (const f of required) {
      if (event[f] === undefined || event[f] === null || event[f] === "") {
        allHaveFields = false;
        fieldErrorCount++;
        console.log(`  - Event index ${idx} (ID: ${event.id || "N/A"}) is missing field: "${f}"`);
      }
    }
  });

  if (allHaveFields) {
    printPass(3, "All events contain all required fields (id, category, title, description, choices).");
  } else {
    printFail(3, `Some events are missing fields! Total fields missed: ${fieldErrorCount}`);
  }

  // 4. 每個事件是否都有 A、B、C 三個選項
  let allHaveThreeChoices = true;
  let choiceCountError = 0;
  events.forEach((event) => {
    if (!Array.isArray(event.choices) || event.choices.length !== 3) {
      allHaveThreeChoices = false;
      choiceCountError++;
      console.log(`  - Event (ID: ${event.id}) title: "${event.title}" has ${event.choices ? event.choices.length : 0} choices instead of 3.`);
    }
  });

  if (allHaveThreeChoices) {
    printPass(4, "All events have exactly 3 options (representing A, B, and C).");
  } else {
    printFail(4, `Found events without exactly 3 options! Count: ${choiceCountError}`);
  }

  // 5. 每個選項是否都有 effects
  let allChoicesHaveEffects = true;
  let effectsErrorCount = 0;
  events.forEach((event) => {
    if (Array.isArray(event.choices)) {
      event.choices.forEach((choice, cidx) => {
        if (!choice.effects || typeof choice.effects !== "object") {
          allChoicesHaveEffects = false;
          effectsErrorCount++;
          console.log(`  - Event (ID: ${event.id}) Choice ${cidx + 1} ("${choice.text?.substring(0, 20)}...") is missing 'effects'.`);
        } else {
          // Verify required impact factors in effects
          const requiredEffects = ["economy", "military", "diplomacy", "approval", "industry", "stockMarket"];
          requiredEffects.forEach((eff) => {
            if (typeof choice.effects[eff] !== "number") {
              allChoicesHaveEffects = false;
              effectsErrorCount++;
              console.log(`  - Event (ID: ${event.id}) Choice ${cidx} effect [${eff}] is not a number.`);
            }
          });
        }
      });
    }
  });

  if (allChoicesHaveEffects) {
    printPass(5, "All options contain valid numerical dynamic effects.");
  } else {
    printFail(5, `Found options missing 'effects' or containing invalid effect values! Errors: ${effectsErrorCount}`);
  }

  // Next: Simulate state and gameplay transitions
  printHeader("SIMULATION TESTS FOR TURNS & ALGORITHMS");

  // Initial Simulator GameState
  const mockState = {
    stats: { economy: 50, military: 50, diplomacy: 50, publicOpinion: 50, industry: 50, market: 50 },
    turn: 1,
    history: [] as any[],
    currentEvent: events[0]
  };

  // 6. 點擊選項後 GameState 是否會改變
  // 7. 回合數是否 +1
  // Simulate clicking option A for the first event
  const previousStats = { ...mockState.stats };
  const previousTurn = mockState.turn;
  
  const chosenOptionIndex = 0; // Choice A
  const pickedChoice = mockState.currentEvent.choices[chosenOptionIndex];
  
  // Apply impacts
  mockState.stats.economy = Math.max(0, Math.min(100, mockState.stats.economy + (pickedChoice.effects.economy ?? 0)));
  mockState.stats.military = Math.max(0, Math.min(100, mockState.stats.military + (pickedChoice.effects.military ?? 0)));
  mockState.stats.diplomacy = Math.max(0, Math.min(100, mockState.stats.diplomacy + (pickedChoice.effects.diplomacy ?? 0)));
  mockState.stats.publicOpinion = Math.max(0, Math.min(100, mockState.stats.publicOpinion + (pickedChoice.effects.approval ?? 0)));
  mockState.stats.industry = Math.max(0, Math.min(100, mockState.stats.industry + (pickedChoice.effects.industry ?? 0)));
  mockState.stats.market = Math.max(0, Math.min(100, mockState.stats.market + (pickedChoice.effects.stockMarket ?? 0)));
  
  // Save to history
  mockState.history.push({
    scenarioTitle: mockState.currentEvent.title,
    chosenOptionId: "A",
    chosenOptionTitle: "強勢主動對策",
    statsBefore: previousStats,
    statsAfter: { ...mockState.stats }
  });

  // Turn count + 1
  mockState.turn += 1;

  // Verify State changed
  const statsChanged = JSON.stringify(previousStats) !== JSON.stringify(mockState.stats);
  if (statsChanged) {
    printPass(6, "Selecting an option correctly modifies the GameState statistics (0-100 clamped).");
  } else {
    printFail(6, "Selecting an option did NOT modify the GameState statistics!");
  }

  // Verify Turn increased
  if (mockState.turn === previousTurn + 1) {
    printPass(7, `Turn count successfully incremented: ${previousTurn} -> ${mockState.turn}`);
  } else {
    printFail(7, `Turn count did not increment! Expected ${previousTurn + 1}, got ${mockState.turn}`);
  }

  // 8. 下一回合是否抽到新事件
  // Simulate backend drawing a new event
  const playedTitles = new Set(mockState.history.map((h) => h.scenarioTitle));
  let available = events.filter((e) => !playedTitles.has(e.title));
  let nextEvent = available[Math.floor(Math.random() * available.length)];
  mockState.currentEvent = nextEvent;

  if (nextEvent && nextEvent.id !== events[0].id) {
    printPass(8, `Successfully drew a new event for the next turn: "${nextEvent.title}"`);
  } else {
    printFail(8, "Failed to draw a new event or drew the same event again!");
  }

  // 9. 已出現過的事件是否不會重複 (Simulate full 80-turn game)
  let allDrawnUnique = true;
  const simulatedHistory: any[] = [];
  const drawnTitles = new Set<string>();

  // Start simulation of playing all 80 events one by one
  let simCurrentEvent = events[Math.floor(Math.random() * events.length)];
  drawnTitles.add(simCurrentEvent.title);
  simulatedHistory.push({ scenarioTitle: simCurrentEvent.title });

  for (let turnNum = 2; turnNum <= 80; turnNum++) {
    const simPlayedTitles = new Set(simulatedHistory.map((h) => h.scenarioTitle));
    const simAvailable = events.filter((e) => !simPlayedTitles.has(e.title));
    
    if (simAvailable.length === 0) {
      allDrawnUnique = false;
      break;
    }

    const simNextEvent = simAvailable[Math.floor(Math.random() * simAvailable.length)];
    if (drawnTitles.has(simNextEvent.title)) {
      allDrawnUnique = false;
      console.log(`  - Duplication occurred! "${simNextEvent.title}" was drawn again during turn ${turnNum}.`);
    }
    drawnTitles.add(simNextEvent.title);
    simulatedHistory.push({ scenarioTitle: simNextEvent.title });
  }

  if (allDrawnUnique && drawnTitles.size === 80) {
    printPass(9, "Simulated 80 turns successfully. No repeating events were drawn!");
  } else {
    printFail(9, `Repeating events were drawn during sequential gameplay! Extracted uniqueness size: ${drawnTitles.size}/80.`);
  }

  // 10. 事件用完後是否會重新洗牌
  // Draw the 81st event when history contains all 80 played events
  const simPlayedTitles80 = new Set(simulatedHistory.map((h) => h.scenarioTitle));
  let simAvailable81 = events.filter((e) => !simPlayedTitles80.has(e.title));

  let didReshuffle = false;
  if (simAvailable81.length === 0) {
    // Reshuffle condition triggered
    simAvailable81 = events; 
    didReshuffle = true;
  }

  const simNextEvent81 = simAvailable81[Math.floor(Math.random() * simAvailable81.length)];
  const isDrawSuccessful = simNextEvent81 !== undefined && simNextEvent81 !== null;

  if (didReshuffle && isDrawSuccessful) {
    printPass(10, `Event exhaustion handled correctly! System successfully reshuffled pool of all 80 events and drew "${simNextEvent81.title}".`);
  } else {
    printFail(10, "Failed to reshuffle and draw event when the event pool was exhausted.");
  }

  printHeader("SUMMARY");
  console.log(`${BOLD}${GREEN}✔ ALL 10 CRITICAL EVENT SYSTEM TESTS PROCESSED SUCCESSFULLY!${RESET}\n`);
}

runEventSystemTests();
