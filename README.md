# Masarif Expense Tracker

Simple static web app for tracking daily and monthly expenses.

## Files

- `index.html`
- `style.css`
- `script.js`
- `manifest.json`
- `service-worker.js`
- `README.md`

No server, backend, database, framework, build step, or PWA offline caching is required.

## Features

- Daily expense input.
- Full month import.
- Flexible parser for Arabic, French, and English category names.
- Monthly budget and alerts.
- Category totals for the selected month.
- Separate income total for `مدخول`, `revenu`, and `income`.
- Total expenses, total income, and net.
- Delete transactions.
- CSV export.
- JSON backup export/import.
- Data saved in `localStorage`.

## Daily Format

```text
قهوة 10
cafe 10
coffee 10
فطور 14
petit dej 14
breakfast 14
غداء 15
dejeuner 15
lunch 15
طاكسي 20
taxi 20
مدخول 1000
```

Unknown categories are saved as `أخرى`.

`مدخول`, `revenu`, and `income` are counted as income, not expenses.

## Full Month Import

Paste this format in `مصروف شهر كامل`:

```text
01/06/2026
قهوة 10
فطور 14
غداء 15

02/06/2026
طاكسي 20
قهوة 10

03/06/2026
صحة 320
دانون 5
مدخول 1000
```

Then click `Importer mois complet`.

The app detects each date, saves each expense line as a separate transaction, and avoids adding the same imported month lines twice.

## Publish On GitHub Pages

1. Upload the files to the root of your GitHub repository.
2. Go to repository `Settings`.
3. Open `Pages`.
4. Choose `Deploy from a branch`.
5. Choose branch `main` and folder `/root`.
6. Save.

The app will work as a normal static web page.

## Important

- The app does not send your data anywhere.
- The app keeps data in the browser with `localStorage`.
- The service worker file is only a cleanup file for old cached versions.
- Use `Export JSON backup` before clearing browser data or changing devices.
