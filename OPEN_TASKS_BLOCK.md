# Open Tasks Workspace Block

A reusable custom workspace HTML block that dynamically displays all open ERPNext tasks relevant to the logged-in user in a scrollable view, sorted by latest tasks first.

## Features

- **Dynamic Task Loading**: Fetches tasks in real-time from the backend
- **User-Specific**: Shows only tasks that are:
  - Assigned to the logged-in user, OR
  - Created by the logged-in user
- **Smart Filtering**: Excludes completed, cancelled, and closed tasks
- **Latest First**: Tasks are sorted by modification date (most recent first)
- **No Limits**: Shows all open tasks without pagination
- **Scrollable View**: Clean, scrollable interface with max height of 600px
- **Refresh Button**: Manual refresh capability
- **Responsive Design**: Works on desktop and mobile
- **Rich Information Display**:
  - Task subject with clickable link
  - Priority badge (Low, Medium, High, Urgent)
  - Status badge
  - Project name (if applicable)
  - Due date with overdue indication
  - Task description (truncated)
  - Assigned users

## Installation

### Step 1: Build Assets

After adding the files, build the Frappe assets:

```bash
cd /home/ruchit/repos/nexity
bench build --app nexity_customization
```

Or for development with auto-reload:

```bash
bench watch
```

### Step 2: Add to Workspace

1. Go to **Workspace** in your ERPNext instance
2. Click on the workspace where you want to add the tasks block (e.g., Home, Projects, etc.)
3. Click **Edit** (top right)
4. Click **Add a new Block** or edit an existing block
5. Select **HTML** as the block type
6. Paste the following code:

```html
<div id="open-tasks-block"></div>
<script>
  frappe.require([
    '/assets/nexity_customization/js/open_tasks_block.js',
    '/assets/nexity_customization/css/open_tasks_block.css'
  ], function() {
    if (window.renderOpenTasksBlock) {
      window.renderOpenTasksBlock('open-tasks-block');
    }
  });
</script>
```

7. Click **Save**

## File Structure

```
nexity_customization/
├── nexity_customization/
│   └── api/
│       └── tasks.py              # Backend API to fetch open tasks
└── public/
    ├── js/
    │   └── open_tasks_block.js   # Frontend rendering logic
    └── css/
        └── open_tasks_block.css  # Styling for the block
```

## API Endpoint

### `get_open_tasks()`

**Method**: `nexity_customization.nexity_customization.api.tasks.get_open_tasks`

**Authentication**: Required (uses `frappe.session.user`)

**Returns**: Array of task objects with fields:
- `name`: Task ID
- `subject`: Task title
- `status`: Current status
- `priority`: Priority level
- `exp_end_date`: Expected end date
- `project`: Associated project
- `modified`: Last modification timestamp
- `owner`: Task creator
- `description_short`: Truncated description
- `assigned_to`: List of assigned users
- `is_owner`: Boolean indicating if current user is owner
- `is_assigned`: Boolean indicating if current user is assigned

## Customization

### Change Maximum Height

Edit [public/css/open_tasks_block.css](apps/nexity_customization/nexity_customization/public/css/open_tasks_block.css#L34):

```css
.open-tasks-body {
  max-height: 600px;  /* Change this value */
}
```

### Modify Task Card Display

Edit [public/js/open_tasks_block.js](apps/nexity_customization/nexity_customization/public/js/open_tasks_block.js) in the `renderTasks()` function to add/remove fields.

### Change Priority Colors

Edit [public/css/open_tasks_block.css](apps/nexity_customization/nexity_customization/public/css/open_tasks_block.css) badge color classes:

```css
.badge-light-blue { /* Low priority */ }
.badge-light-gray { /* Medium priority */ }
.badge-light-orange { /* High priority */ }
.badge-light-red { /* Urgent priority */ }
```

## Multiple Instances

You can add multiple instances of this block to different workspaces or even the same workspace. Each instance will fetch and display the same data for the logged-in user.

To add another instance, use a different container ID:

```html
<div id="my-tasks-block-2"></div>
<script>
  frappe.require([
    '/assets/nexity_customization/js/open_tasks_block.js',
    '/assets/nexity_customization/css/open_tasks_block.css'
  ], function() {
    if (window.renderOpenTasksBlock) {
      window.renderOpenTasksBlock('my-tasks-block-2');
    }
  });
</script>
```

## Troubleshooting

### Block Not Showing

1. **Check if assets are built**:
   ```bash
   bench build --app nexity_customization
   ```

2. **Clear cache**:
   ```bash
   bench --site nexity.site clear-cache
   ```

3. **Check browser console** for JavaScript errors

### No Tasks Displaying

1. **Verify you have open tasks**: Go to Task list and check
2. **Ensure tasks are assigned to you or created by you**
3. **Check task status**: Only non-completed/cancelled/closed tasks show
4. **Check browser console** for API errors

### Styling Issues

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. **Rebuild assets**:
   ```bash
   bench build --app nexity_customization
   ```
3. **Check CSS is loaded**: View source and verify CSS file loads

## Development

For development, use watch mode for automatic rebuilds:

```bash
bench watch
```

This will automatically rebuild assets when you modify JS or CSS files.

## Technical Notes

- Uses Frappe's `frappe.call()` for API requests
- Leverages Frappe's icon system for UI elements
- Uses Frappe's CSS variables for theming consistency
- Implements XSS protection via HTML escaping
- Mobile-responsive with flexbox layout
- Custom scrollbar styling for better UX
