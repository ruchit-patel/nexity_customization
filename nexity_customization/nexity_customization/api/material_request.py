import frappe
from frappe import _


@frappe.whitelist()
def get_next_approver_info(docname):
	"""
	Get information about the next approver for a Material Request

	Args:
		docname: Name of the Material Request document

	Returns:
		dict: Contains next approver details and workflow state
	"""
	try:
		doc = frappe.get_doc("Material Request", docname)

		# Get current workflow state
		workflow_state = doc.get("workflow_state")

		# Get workflow details
		workflow = frappe.get_doc("Workflow", "MR cycle")

		# Find next states from current state
		next_transitions = [
			t for t in workflow.transitions if t.state == workflow_state and t.action != "Reject"
		]

		approver_info = {
			"current_state": workflow_state,
			"next_states": [],
			"document_status": doc.docstatus,
			"material_request_type": doc.material_request_type,
			"company": doc.company,
			"schedule_date": doc.schedule_date,
			"total_qty": sum([item.qty for item in doc.items]) if doc.items else 0,
		}

		# Get approver details for each possible next state
		for transition in next_transitions:
			next_state_info = {
				"action": transition.action,
				"next_state": transition.next_state,
				"allowed_role": transition.allowed,
				"condition": transition.condition or None,
			}

			# Get users with the allowed role
			users = frappe.get_all(
				"Has Role",
				filters={"role": transition.allowed, "parenttype": "User"},
				fields=["parent as user"],
			)

			# Get user details
			approvers = []
			for user in users[:5]:  # Limit to first 5 approvers
				user_doc = frappe.get_doc("User", user.user)
				if user_doc.enabled:
					approvers.append(
						{"user": user_doc.name, "full_name": user_doc.full_name, "email": user_doc.email}
					)

			next_state_info["approvers"] = approvers
			approver_info["next_states"].append(next_state_info)

		return approver_info

	except Exception as e:
		frappe.log_error(f"Error getting next approver info: {str(e)}")
		return {"error": str(e), "current_state": None, "next_states": []}


@frappe.whitelist()
def submit_with_confirmation(docname):
	"""
	Submit Material Request after user confirmation

	Args:
		docname: Name of the Material Request document

	Returns:
		dict: Success status and redirect information
	"""
	try:
		doc = frappe.get_doc("Material Request", docname)

		# Set flag to indicate confirmation was shown
		frappe.flags.mr_submit_confirmed = True

		# Submit the document
		doc.submit()

		# Clear the flag
		frappe.flags.mr_submit_confirmed = False

		# Get next approver info after submission
		approver_info = get_next_approver_info(docname)

		return {
			"success": True,
			"message": _("Material Request {0} submitted successfully").format(docname),
			"docname": docname,
			"workflow_state": doc.workflow_state,
			"approver_info": approver_info,
		}

	except Exception as e:
		frappe.log_error(f"Error submitting Material Request: {str(e)}")
		frappe.flags.mr_submit_confirmed = False
		return {"success": False, "message": str(e), "error": str(e)}
