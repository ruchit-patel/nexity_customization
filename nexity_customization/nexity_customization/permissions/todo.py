import frappe


def get_permission_query_conditions(user):
	"""
	Limit ToDo visibility to assigned user only (except for Administrator).

	Args:
	    user: The user for whom to apply permission filters

	Returns:
	    str: SQL condition string to filter ToDo records
	"""
	if not user:
		user = frappe.session.user

	# Administrator can see all todos
	if user == "Administrator":
		return None

	# All other users can only see todos assigned to them
	return f"`tabToDo`.allocated_to = {frappe.db.escape(user)}"
