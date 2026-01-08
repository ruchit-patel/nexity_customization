# Open ToDos Workspace Block

A reusable custom workspace HTML block that dynamically displays all open ToDo items for the logged-in user in a scrollable view with infinite scroll pagination, sorted by latest first.

## Features

- **Dynamic ToDo Loading**: Fetches ToDo items in real-time from the backend
- **User-Specific**: Shows only ToDos assigned to the logged-in user
- **Smart Filtering**: Shows only "Open" and "Pending" status ToDos
- **Latest First**: ToDos are sorted by modification date (most recent first)
- **Infinite Scroll**: Loads 15 items initially, then loads more as you scroll down
- **Pagination**: Efficient loading with automatic pagination
- **Scrollable View**: Clean, scrollable interface with max height of 600px
- **Refresh Button**: Manual refresh capability (🔄 icon)
- **Rich Information Display**:
  - ToDo description (clickable link if reference exists)
  - Priority badge (Low, Medium, High, Urgent)
  - Status badge (Open, Pending)
  - Reference document link (e.g., Task, Issue, etc.)
  - Due date with overdue indication
  - Assigned by user information

## Installation

### Step 1: Build Assets

```bash
cd /home/ruchit/repos/nexity
bench build --app nexity_customization
```

### Step 2: Add to Workspace

Copy the code from `workspace_html_snippet.html` and paste it into an HTML block in your workspace.

## API Endpoint

**Method**: `nexity_customization.nexity_customization.api.tasks.get_open_todos`

**Parameters**:
- `start` (int): Starting index (default: 0)
- `page_length` (int): Items to fetch (default: 15)

## Infinite Scroll

- Loads 15 items initially
- Automatically loads more when scrolling near bottom
- Shows "Loading more..." indicator
- Shows "End of list" when all loaded

## Customization

Edit `api/tasks.py` or `open_tasks_block.js` to adjust page size, scroll threshold, or styling.

## Troubleshooting

1. Build assets: `bench build --app nexity_customization`
2. Clear cache: `bench --site nexity.site clear-cache`
3. Hard refresh browser (Ctrl+Shift+R)
