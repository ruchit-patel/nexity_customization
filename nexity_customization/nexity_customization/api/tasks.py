import frappe
import json
from frappe import _
from frappe.utils import strip_html_tags, get_datetime, time_diff_in_seconds, now_datetime


@frappe.whitelist()
def get_open_todos(start=0, page_length=15, sort_order="latest"):
	"""
	Get open ToDo documents for the logged-in user with pagination.

	Args:
		start (int): Starting index for pagination (default: 0)
		page_length (int): Number of records to fetch (default: 15)
		sort_order (str): 'latest' or 'oldest' (default: 'latest')

	Returns:
		dict: Contains 'todos' list and 'has_more' boolean
	"""
	try:
		user = frappe.session.user
		start = int(start)
		page_length = int(page_length)

		# Determine sort order
		order_by = "modified desc" if sort_order == "latest" else "modified asc"

		# Fetch open ToDo documents for the user
		todos = frappe.get_all(
			"ToDo",
			filters={
				"allocated_to": user,
				"status": ["in", ["Open", "Pending"]]
			},
			fields=[
				"name",
				"description",
				"status",
				"priority",
				"date",
				"reference_type",
				"reference_name",
				"assigned_by",
				"modified",
				"owner",
				"_seen"
			],
			order_by=order_by,
			start=start,
			page_length=page_length + 1  # Fetch one extra to check if more exist
		)

		# Check if there are more records
		has_more = len(todos) > page_length
		if has_more:
			todos = todos[:page_length]  # Remove the extra record

		# Enrich ToDo data
		for todo in todos:
			# Strip HTML from description and format
			if todo.description:
				clean_description = strip_html_tags(todo.description).strip()
				clean_description = " ".join(clean_description.split())
				todo["description_short"] = (
					clean_description[:150] + "..." if len(clean_description) > 150 else clean_description
				)
			else:
				todo["description_short"] = ""

			# Check if this is a rejected/cancelled task
			desc_lower = (todo.description_short or "").lower()
			is_rejected = "rejected" in desc_lower or "returned" in desc_lower
			todo["is_rejected"] = is_rejected

			# Get assigned by user info
			if todo.assigned_by:
				assigned_by_user = frappe.get_cached_value("User", todo.assigned_by, ["full_name", "user_image"])
				todo["assigned_by_name"] = assigned_by_user[0] if assigned_by_user else todo.assigned_by
				todo["assigned_by_image"] = assigned_by_user[1] if assigned_by_user and len(assigned_by_user) > 1 else None
			else:
				todo["assigned_by_name"] = None
				todo["assigned_by_image"] = None

			# Set the label based on rejection status
			todo["assigned_by_label"] = "Rejected by" if is_rejected else "Raised by"

			# Format date and calculate due status
			if todo.date:
				todo["date_formatted"] = frappe.utils.format_date(todo.date)
				due_date = get_datetime(todo.date)
				now = now_datetime()

				# Calculate days difference (using dates only, not time)
				days_diff = (due_date.date() - now.date()).days

				if days_diff < 0:
					# Task is overdue (past date)
					todo["is_overdue"] = True
					days_overdue = abs(days_diff)
					if days_overdue == 1:
						todo["due_text"] = "Overdue by 1 day"
					else:
						todo["due_text"] = f"Overdue by {days_overdue} days"
				elif days_diff == 0:
					# Task is due today
					todo["is_overdue"] = False
					todo["due_text"] = "Due today"
				elif days_diff == 1:
					# Task is due tomorrow
					todo["is_overdue"] = False
					todo["due_text"] = "Due tomorrow"
				else:
					# Task is due in the future
					todo["is_overdue"] = False
					todo["due_text"] = f"Due in {days_diff} days"
			else:
				todo["date_formatted"] = None
				todo["is_overdue"] = False
				todo["due_text"] = None

			# Calculate time ago
			if todo.modified:
				todo["time_ago"] = frappe.utils.pretty_date(todo.modified)
			else:
				todo["time_ago"] = ""

			# Get reference document link if exists
			if todo.reference_type and todo.reference_name:
				# Use kebab-case for route (material-request not material_request)
				route_name = frappe.scrub(todo.reference_type).replace("_", "-")
				todo["reference_link"] = f"/app/{route_name}/{todo.reference_name}"
			else:
				todo["reference_link"] = None

			# Check if seen (using _seen field - it's a JSON array)
			try:
				seen_list = json.loads(todo.get("_seen") or "[]")
				todo["is_seen"] = user in seen_list
			except (json.JSONDecodeError, TypeError):
				todo["is_seen"] = False

		return {
			"todos": todos,
			"has_more": has_more,
			"total_fetched": len(todos),
			"next_start": start + page_length
		}

	except Exception as e:
		frappe.log_error(f"Error fetching open todos: {str(e)}", "Open ToDos API Error")
		return {
			"todos": [],
			"has_more": False,
			"error": str(e)
		}


@frappe.whitelist()
def mark_todo_as_seen(todo_name):
	"""
	Mark a ToDo as seen by the current user.

	Args:
		todo_name (str): Name of the ToDo document

	Returns:
		dict: Success status
	"""
	try:
		user = frappe.session.user

		# Get the todo document
		todo = frappe.get_doc("ToDo", todo_name)

		# Check if user has access
		if todo.allocated_to != user:
			frappe.throw(_("You don't have permission to mark this ToDo as seen"))

		# Get existing _seen field and parse as JSON array
		try:
			seen_list = json.loads(todo.get("_seen") or "[]")
		except (json.JSONDecodeError, TypeError):
			seen_list = []

		# Add user to seen list if not already there
		if user not in seen_list:
			seen_list.append(user)
			# Update _seen field with JSON array
			frappe.db.set_value("ToDo", todo_name, "_seen", json.dumps(seen_list), update_modified=False)
			frappe.db.commit()

		return {"success": True, "message": "Marked as seen"}

	except Exception as e:
		frappe.log_error(f"Error marking todo as seen: {str(e)}", "Mark ToDo Seen Error")
		return {"success": False, "error": str(e)}
