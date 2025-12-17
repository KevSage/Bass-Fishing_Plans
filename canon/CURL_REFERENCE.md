# BFP / AnglerIQ — curl Reference (V1)

Base URL:
http://127.0.0.1:8000

---

## Health check (no auth required)

curl http://127.0.0.1:8000/health

Expected:
{"status":"ok"}

---

## Preview plan — ZIP only (minimum viable request)

curl -s http://127.0.0.1:8000/plan/preview -H "Content-Type: application/json" -H "X-API-Key: some-long-random-string" -d '{"zip":"30303"}'

Expected:
- plan.phase populated
- plan.primary_presentation_family populated
- plan.pattern_2 present
- conditions.is_preview == true
- conditions.is_future_trip == false

---

## Preview plan — past trip date

curl -s http://127.0.0.1:8000/plan/preview -H "Content-Type: application/json" -H "X-API-Key: some-long-random-string" -d '{"zip":"30303","trip_date":"2025-12-15"}'

Expected:
- conditions.trip_date == "2025-12-15"
- conditions.is_future_trip == false
- conditions.is_preview == true

---

## Preview plan — future trip date

curl -s http://127.0.0.1:8000/plan/preview -H "Content-Type: application/json" -H "X-API-Key: some-long-random-string" -d '{"zip":"30303","trip_date":"2026-01-15"}'

Expected:
- conditions.trip_date == "2026-01-15"
- conditions.is_future_trip == true
- conditions.is_preview == true

---

## Preview plan — pipe conditions sanity check

curl -s http://127.0.0.1:8000/plan/preview -H "Content-Type: application/json" -H "X-API-Key: some-long-random-string" -d '{"zip":"30303","trip_date":"2025-12-15"}' | python -c "import sys,json; j=json.load(sys.stdin); c=j['plan']['conditions']; print('trip_date', c.get('trip_date'), 'is_future_trip', c.get('is_future_trip'), 'is_preview', c.get('is_preview'))"
