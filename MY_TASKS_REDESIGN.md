# My Tasks Block - Complete Redesign

## New Features

### 1. Modern Card-Based UI
- Clean white cards with subtle shadows
- Color-coded left border (blue/yellow/red for status/priority)
- Proper spacing and typography
- Professional icon design using inline SVG

### 2. Sorting Options
- **Latest First** (default) - Shows newest todos first
- **Oldest First** - Shows oldest todos first
- Toggle buttons at the top

### 3. Seen/Unseen Tracking
- **Unseen todos**: Full white background, full opacity
- **Seen todos**: Faded gray background (opacity 0.7)
- Automatically marks as "seen" when clicked
- Uses `_seen` field in ToDo doctype

### 4. Rich Information Display
- **Reference ID**: Blue badge (e.g., MR-2023-001)
- **Time ago**: Relative time (e.g., "2 days ago")
- **Task title**: Clear, bold description
- **Reference item**: Linked document info
- **Assigned by**: Who created the todo
- **Rejection status**: Red banner if rejected/returned

### 5. Icons
- Inline SVG icons (Lucide-style)
- Different icons for each reference type:
  - 📦 Material Request
  - 🛒 Purchase Order
  - 📅 Leave Application
  - 📄 Document
  - ✓ Task
  - ⚠️ Issue

### 6. Click Behavior
- Click anywhere on card → Navigate to ToDo
- Marks as "seen" before navigation
- Prevents double-marking

## API Changes

### `get_open_todos`
**New Parameters**:
- `sort_order`: "latest" or "oldest" (default: "latest")

**New Return Fields**:
- `time_ago`: Human-readable time (e.g., "3 hours ago")
- `is_seen`: Boolean indicating if user has seen this todo

### `mark_todo_as_seen` (NEW)
Marks a todo as seen by setting `_seen` field to current user.

**Parameters**:
- `todo_name`: ToDo document name

**Returns**:
- `success`: Boolean
- `message`: Status message

## Visual Design

### Colors
- **Blue** (#2563eb): Default border, buttons, badges
- **Yellow** (#f59e0b): Pending status
- **Red** (#ef4444): High priority, overdue, rejected
- **Gray** (#6b7280): Text, icons, seen state

### Card States
1. **Normal**: White background, colored left border
2. **Hover**: Shadow elevation, darker border
3. **Seen**: Gray background, 70% opacity
4. **Seen + Hover**: Gray background, 100% opacity

## Usage

Same HTML snippet as before - the new design is applied automatically!

```html
<div id="open-tasks-block"></div>
<style>
@import url('/assets/nexity_customization/css/open_tasks_block.css');
</style>
<script>
  frappe.require([
    '/assets/nexity_customization/js/open_tasks_block.js'
  ], function() {
    frappe.after_ajax(function() {
      if (window.renderOpenTasksBlock && root_element) {
        window.renderOpenTasksBlock(root_element);
      }
    });
  });
</script>
```

## Files Modified

1. **api/tasks.py**
   - Added `sort_order` parameter
   - Added `time_ago` calculation
   - Added `is_seen` check
   - New `mark_todo_as_seen()` method

2. **public/js/open_tasks_block.js**
   - Complete rewrite with new UI
   - Inline SVG icons
   - Sorting functionality
   - Click-to-mark-seen logic

3. **public/css/open_tasks_block.css**
   - Complete redesign
   - Card-based layout
   - Modern color scheme
   - Responsive design

## Testing

1. **Refresh browser** (Ctrl+Shift+R)
2. Workspace should show new design
3. Click **"Latest First"/"Oldest First"** to test sorting
4. Click a todo → Should mark as seen (fade out) and navigate
5. Refresh → Seen todos stay faded

## Notes

- Seen state persists in database (`_seen` field)
- Works in shadow DOM (workspace HTML blocks)
- Infinite scroll still works
- All previous features retained
