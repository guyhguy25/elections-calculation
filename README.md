# מנדט — election mandate calculator

Local web app that pulls Israel’s 26th Knesset national results from the Central Elections Committee, then reproduces this mandate math:

1. Take **קולות עד עתה** and compute **3.25%** → block threshold  
2. Keep lists whose **קולות כשרים לרשימה** meet that threshold  
3. Sum those votes → **kosher votes**  
4. Divide by **120** → electoral mandate  
5. Give each qualifying list `votes / mandate` seats (whole seats via largest remainders)

The UI refreshes automatically every **90 seconds**, and you can refresh manually.

When a party’s seat count changes from the previous snapshot, a small **+1 / -1** tip appears next to its mandates (and in a short banner). Tips stick until the next seat move.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

One-shot CLI reprint:

```bash
npm run calc
```

## API

`GET /api/results` returns the parsed snapshot and calculated seats as JSON.

If the official page is unreachable from the server, the API falls back to a markdown reader of the same URL.

## Production

Live on Vercel: [https://elections-calculation.vercel.app](https://elections-calculation.vercel.app)

## Notes

- Numbers can change while counting continues.
- This is not an official seat publication; it follows the calculation above (no surplus agreements).
