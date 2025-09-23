# Apify Process Management & Abort Functionality

## Overview
The system now includes comprehensive process management for Apify Facebook Groups Scraper runs, allowing you to monitor and abort long-running processes.

## API Endpoints

### 1. Check Running Processes
```bash
GET /api/scraping/abort
```
Returns all currently running Apify processes and recent runs.

### 2. Abort Specific Process
```bash
POST /api/scraping/abort
Content-Type: application/json

{
  "runId": "specific-run-id-here"
}
```

### 3. Abort All Running Processes
```bash
POST /api/scraping/abort
Content-Type: application/json

{
  "abortAll": true
}
```

## Usage Examples

### Check for running processes:
```bash
curl -X GET "http://localhost:3000/api/scraping/abort"
```

### Abort a specific run:
```bash
curl -X POST "http://localhost:3000/api/scraping/abort" \
  -H "Content-Type: application/json" \
  -d '{"runId": "your-run-id-here"}'
```

### Abort all running processes:
```bash
curl -X POST "http://localhost:3000/api/scraping/abort" \
  -H "Content-Type: application/json" \
  -d '{"abortAll": true}'
```

## How It Works

1. **Process Monitoring**: The system tracks all Apify runs using the official Apify API
2. **Abort Mechanism**: Uses the correct Apify endpoint `POST /v2/actor-runs/:runId/abort`
3. **Status Tracking**: Monitors run status (RUNNING, SUCCEEDED, FAILED, ABORTED)
4. **Automatic Cleanup**: Aborted runs are properly handled and tracked

## When to Use

- **Long-running scrapes**: If a Facebook group scrape is taking too long
- **Resource management**: To free up Apify compute units
- **Error recovery**: When a process appears stuck or unresponsive
- **Scheduled maintenance**: Before deploying updates or maintenance

## Integration with Existing Flows

The abort functionality integrates seamlessly with:
- Manual scraping (`/api/scraping/manual`)
- Auto scraping (`/api/scraping/auto`) 
- Trigger scraping (`/api/scraping/trigger`)
- Process management (`/api/scraping/process`)

## Monitoring Tips

1. Check running processes before starting new scrapes
2. Set reasonable timeouts for your scraping operations
3. Monitor the logs for any stuck processes
4. Use abort functionality proactively for better resource management

## Technical Implementation

The abort functionality uses:
- **Apify API v2**: Official REST API endpoints
- **Real-time monitoring**: Live status checks
- **Proper error handling**: Graceful failure management
- **TypeScript interfaces**: Type-safe process management