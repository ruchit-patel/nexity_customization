import frappe
from frappe import _


def before_submit(doc, method):
	"""
	Hook called before Material Request is submitted.
	Validates that user has confirmed the submission via the confirmation dialog.
	"""
	# Check if this is being called from our custom API (which already showed confirmation)
	# or if it's a direct submit that needs validation
	if not doc.get("_skip_confirmation_check"):
		# Check if confirmation flag is set
		confirmation_flag = frappe.flags.get("mr_submit_confirmed")

		if not confirmation_flag:
			frappe.throw(
				_("Please use the Submit button to submit this Material Request. Direct submission is not allowed."),
				title=_("Confirmation Required")
			)
