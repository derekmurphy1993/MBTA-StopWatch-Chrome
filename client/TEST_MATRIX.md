# MBTA StopWatch Test Matrix

## P0

| Scenario | Why It Matters | Test Steps | Expected Result |
|---|---|---|---|
| Terminal station selected (first/last stop) | Slot math can break with 0 preceding stops | Pick first stop on line, then last stop | No crash; trackers render; out-of-range and DUE behavior remain correct |
| Red branch split (Ashmont/Braintree) | High risk for wrong slotting | Track stops around JFK/UMass and each branch | Trackers place on correct branch stops, not opposite branch |
| Direction change while stream is active | Can show stale/incorrect trackers | Switch direction repeatedly while trains update | Old data clears; only new direction data renders |
| Stop change while stream is active | Known issue area | Change stop quickly 3-4 times | Preceding slots and trackers recompute for newest stop only |
| `related_stop_id` not found in `directionStops` | Seen in live debug (`related_stop_not_in_direction`) | Use case where vehicle stop id is outside filtered list | Fallback path places tracker sensibly; not stuck out-of-range |
| `< 1 min` arrival | Core UX rule | Find train with ~30-50 sec ETA | Tracker goes to DUE; card shows `NOW ARRIVING` |

## P1

| Scenario | Why It Matters | Test Steps | Expected Result |
|---|---|---|---|
| Prediction without vehicle relationship | API incompleteness edge | Mock/remove `relationships.vehicle` for one prediction | No crash; prediction still listed; tracker degrades gracefully |
| `INCOMING_AT`/`STOPPED_AT` with missing stop id | Partial real-time payloads happen | Simulate status with null stop fields | Uses fallback; avoids incorrect right-offset behavior |
| Duplicate/similar stop names | Name fallback can mis-map | Force two matching names across direction dataset | No incorrect slot jump; ID-based match stays preferred |
| Stale/negative timestamps | Can cause label flicker | Simulate stale arrival/departure times | Labels stay stable (`DUE`/`>15`) without large bouncing |
| Out-of-range grouping with multiple trains | Key display requirement | Ensure 2+ trains beyond furthest preceding stop | Single grouped tracker with shortest ETA `>X min` |
| Line switch confirm/cancel flow | Session safety requirement | Switch line and cancel; then switch and confirm | Cancel keeps session; confirm clears stop/direction and returns to selection |

## P2

| Scenario | Why It Matters | Test Steps | Expected Result |
|---|---|---|---|
| No predictions available | Common user state | Use stop/time with no active trains | `No active predictions` shown cleanly |
| Network interruption / reconnect | Real user condition | Go offline then reconnect | UI recovers after reconnect without reload |
| Long-running tab/sleep resume | SSE can drift | Leave tab idle/sleep then wake | Data rehydrates; trackers reflect current state |
| Cookie type consistency (`direction` string/number) | Prevent subtle comparison bugs | Persist, reload, switch direction | Direction dropdown and fetch filters remain consistent |
