import frappe
from frappe import _
from frappe.utils import strip_html_tags


@frappe.whitelist()
def get_open_tasks():
	"""
	Get all open tasks for the logged-in user.

	Returns tasks where:
	- Status is not 'Completed', 'Cancelled', or 'Closed'
	- User is either assigned to the task or is the owner

	Returns:
		list: List of task dictionaries sorted by modified date (latest first)
	"""
	try:
		user = frappe.session.user

		# Get tasks assigned to the user via _assign field
		assigned_tasks = frappe.get_all(
			"ToDo",
			filters={
				"reference_type": "Task",
				"allocated_to": user,
				"status": ["!=", "Closed"]
			},
			fields=["reference_name"]
		)

		assigned_task_names = [t.reference_name for t in assigned_tasks if t.reference_name]

		# Build filters for tasks
		filters = {
			"status": ["not in", ["Completed", "Cancelled", "Closed"]]
		}

		# Get all open tasks (either assigned or owned by user)
		or_filters = []

		if assigned_task_names:
			or_filters.append({"name": ["in", assigned_task_names]})

		or_filters.append({"owner": user})

		# Fetch tasks
		tasks = frappe.get_all(
			"Task",
			filters=filters,
			or_filters=or_filters if or_filters else None,
			fields=[
				"name",
				"subject",
				"status",
				"priority",
				"exp_end_date",
				"project",
				"modified",
				"owner",
				"description"
			],
			order_by="modified desc"
		)

		# Enrich task data with assignment info
		for task in tasks:
			# Get assigned users
			task_assignments = frappe.get_all(
				"ToDo",
				filters={
					"reference_type": "Task",
					"reference_name": task.name,
					"status": ["!=", "Closed"]
				},
				fields=["allocated_to", "description"],
				pluck="allocated_to"
			)

			task["assigned_to"] = task_assignments
			task["is_owner"] = task.owner == user
			task["is_assigned"] = user in task_assignments

			# Format description (limit length and strip HTML)
			if task.description:
				# Strip HTML tags from description
				clean_description = strip_html_tags(task.description).strip()
				# Remove extra whitespace
				clean_description = " ".join(clean_description.split())
				task["description_short"] = (
					clean_description[:100] + "..." if len(clean_description) > 100 else clean_description
				)
			else:
				task["description_short"] = ""

		return tasks

	except Exception as e:
		frappe.log_error(f"Error fetching open tasks: {str(e)}", "Open Tasks API Error")
		return []
