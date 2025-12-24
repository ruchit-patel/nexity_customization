# Material Request Customization

This document describes the customizations made to the Material Request workflow in the nexity_customization app.

## Features Implemented

### 1. Custom Workflow ("MR cycle")
A comprehensive approval workflow for Material Requests with multiple states and conditional transitions.

**Custom Workflow States:**
- `Issued` - Material has been issued
- `Accepted` - Material request accepted
- `Awaiting Salvage` - Waiting for salvage process
- `MR Closed` - Material request closed

**Workflow Transitions:**
- Draft → Pending Approval (for Material Request User)
- Draft → Pending Approval (Stock Manager) (for Material Transfer type)
- Draft → Submitted (for Purchase type, Stock Manager)
- Pending Approval → Approved/Rejected
- Pending Approval (Stock Manager) → Approved/Rejected
- Issued → Accepted
- Awaiting Salvage → MR Closed

### 2. Confirmation Dialog Before Submission
When a user clicks the "Submit for Approval" button on a Material Request, they see a confirmation dialog displaying:
- Material Request Type
- Company
- Required By date
- List of items with quantities
- Information message about the approval process

### 3. Success Landing Page
After successful submission, users are redirected to a dedicated success page showing:
- ✅ Success confirmation with animated icon
- Request ID with clickable link
- Current workflow status
- Request details (type, company, required date, total quantity)
- Next approver information including:
  - Required action and next state
  - Role required for approval
  - List of users with that role (up to 5)
- Action buttons:
  - Submit New Request
  - View Dashboard
  - View This Request
- "What happens next?" information section

## Files Created/Modified

### Backend Files

1. **`nexity_customization/api/material_request.py`**
   - `get_next_approver_info(docname)` - Fetches next approver details and workflow information
   - `submit_with_confirmation(docname)` - Handles submission and returns complete response data

2. **`nexity_customization/fixtures/workflow_state.json`**
   - Defines the 4 custom workflow states

3. **`nexity_customization/fixtures/workflow.json`**
   - Complete workflow configuration with states and transitions

4. **`nexity_customization/install.py`**
   - `after_install()` - Automatically installs workflow on app installation
   - `install_workflow_states()` - Creates custom workflow states
   - `install_workflows()` - Creates/updates the MR cycle workflow

### Frontend Files

1. **`nexity_customization/public/js/material_request.js`**
   - Client script for Material Request doctype
   - Shows custom confirmation dialog
   - Handles submission process
   - Redirects to success page

2. **`nexity_customization/page/mr_success/mr_success.js`**
   - Success page logic
   - Fetches and displays submission data
   - Handles navigation actions

3. **`nexity_customization/page/mr_success/mr_success.css`**
   - Styling for the success page
   - Responsive design
   - Animations and transitions

4. **`nexity_customization/page/mr_success/mr_success.json`**
   - Page metadata
   - Role permissions (Material Request User)

### Configuration Files

1. **`nexity_customization/hooks.py`**
   - Updated to include:
     - `fixtures` configuration
     - `after_install` hook
     - `doctype_js` for Material Request

## Installation

The workflow is automatically installed when you install the app:

```bash
# Install the app on a site
bench --site nexity.site install-app nexity_customization

# If already installed, run migrate to apply updates
bench --site nexity.site migrate
```

## Testing the Implementation

1. **Create a Material Request:**
   - Go to Stock → Material Request → New
   - Fill in the required details
   - Add items

2. **Submit with Confirmation:**
   - Click "Submit for Approval" button
   - Review the confirmation dialog
   - Click "Yes" to proceed

3. **View Success Page:**
   - Automatically redirected after submission
   - Review request details and next approver info
   - Use action buttons to navigate

4. **Access Success Page Directly:**
   - Navigate to: `/app/mr-success/[Material Request ID]`

## API Endpoints

### Get Next Approver Information
```python
frappe.call({
    method: 'nexity_customization.nexity_customization.api.material_request.get_next_approver_info',
    args: {
        docname: 'MAT-REQ-2025-00001'
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```

**Response:**
```json
{
    "current_state": "Pending Approval",
    "next_states": [
        {
            "action": "Approve",
            "next_state": "Approved",
            "allowed_role": "Material Request Approver",
            "approvers": [
                {
                    "user": "user@example.com",
                    "full_name": "John Doe",
                    "email": "user@example.com"
                }
            ]
        }
    ],
    "material_request_type": "Material Issue",
    "company": "Your Company",
    "schedule_date": "2025-12-31",
    "total_qty": 100
}
```

### Submit with Confirmation
```python
frappe.call({
    method: 'nexity_customization.nexity_customization.api.material_request.submit_with_confirmation',
    args: {
        docname: 'MAT-REQ-2025-00001'
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```

## Customization Notes

### Modifying the Workflow

To modify the workflow:

1. Edit `nexity_customization/install.py` - Update the `workflow_data` dictionary
2. Run migration: `bench --site nexity.site migrate`
3. Or manually update via: Setup → Workflow → MR cycle

### Adding More Workflow States

1. Add state to `install_workflow_states()` in `install.py`:
```python
{"name": "New State", "style": "Primary"}
```

2. Add transitions in `install_workflows()` workflow_data

3. Run: `bench --site nexity.site migrate`

### Customizing the Success Page

Edit these files:
- **Layout/Content:** `page/mr_success/mr_success.js` (render method)
- **Styling:** `page/mr_success/mr_success.css`
- **Permissions:** `page/mr_success/mr_success.json` (roles array)

### Customizing the Confirmation Dialog

Edit `public/js/material_request.js`:
- Modify `show_submit_confirmation()` function
- Update the `confirmation_html` variable

## Troubleshooting

### Workflow not appearing
```bash
bench --site nexity.site migrate
bench --site nexity.site clear-cache
```

### Client script not loading
```bash
bench build --app nexity_customization
bench --site nexity.site clear-cache
```

### Success page styles not applying
```bash
bench build --app nexity_customization
# Hard refresh browser (Ctrl+Shift+R)
```

### Permission issues
Ensure user has these roles:
- Material Request User (for creating and viewing)
- Material Request Approver (for approving)
- Stock Manager (for stock-related approvals)

## Future Enhancements

Potential improvements:
1. Email notifications with approver details
2. SMS notifications for critical requests
3. Approval timeline visualization
4. Bulk approval interface
5. Custom reports for workflow analytics
6. Integration with mobile app
7. Escalation mechanism for delayed approvals
8. Auto-assignment of approvers based on rules
