frappe.ui.form.on('Material Request', {
	refresh: function(frm) {
		// Hide the standard Submit button and add our custom one
		if (frm.doc.docstatus === 0 && !frm.is_new()) {
			// Hide the standard submit menu item
			setTimeout(() => {
				// Remove Submit from Actions dropdown
				frm.page.clear_actions_menu();

				// Remove the standard primary action (Submit button)
				frm.page.clear_primary_action();

				// Add our custom Submit button
				frm.page.set_primary_action(__('Submit'), function() {
					// Show confirmation dialog instead of direct submit
					show_submit_confirmation(frm);
				});
			}, 10);
		}
	},

	before_submit: function(frm) {
		// Block any direct submit attempts
		frappe.throw(__('Please use the Submit button to submit this Material Request.'));
		return false;
	}
});

function show_submit_confirmation(frm) {
	// Build confirmation message with MR details
	let items_summary = '';
	if (frm.doc.items && frm.doc.items.length > 0) {
		items_summary = '<div class="mt-3"><strong>Items:</strong><ul class="mt-2">';
		frm.doc.items.forEach(item => {
			items_summary += `<li>${item.item_code || item.item_name} - Qty: ${item.qty} ${item.uom || ''}</li>`;
		});
		items_summary += '</ul></div>';
	}

	let confirmation_html = `
		<div style="padding: 10px;">
			<p style="font-size: 14px; margin-bottom: 15px;">
				You are about to submit this Material Request for approval.
				Please review the details below:
			</p>
			<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
				<div><strong>Material Request Type:</strong> ${frm.doc.material_request_type || '-'}</div>
				<div class="mt-2"><strong>Company:</strong> ${frm.doc.company || '-'}</div>
				<div class="mt-2"><strong>Required By:</strong> ${frappe.datetime.str_to_user(frm.doc.schedule_date) || '-'}</div>
				${items_summary}
			</div>
			<p style="font-size: 13px; color: #6c757d;">
				<i class="fa fa-info-circle"></i>
				Once submitted, this request will be sent to the approver based on the workflow.
			</p>
		</div>
	`;

	frappe.confirm(
		confirmation_html,
		function() {
			// User confirmed - proceed with submission
			submit_material_request(frm);
		},
		function() {
			// User cancelled
			frappe.show_alert({
				message: __('Submission cancelled'),
				indicator: 'orange'
			});
		}
	);
}

function submit_material_request(frm) {
	// Call custom API which handles confirmation flag and submission
	frappe.call({
		method: 'nexity_customization.nexity_customization.api.material_request.submit_with_confirmation',
		args: {
			docname: frm.doc.name
		},
		callback: function(r) {
			if (r.message && r.message.success) {
				// Show success message
				frappe.show_alert({
					message: r.message.message,
					indicator: 'green'
				}, 5);

				// Reload the form
				frm.reload_doc();

				// Redirect to success page with data
				setTimeout(() => {
					redirect_to_success_page(frm.doc.name, r.message);
				}, 1000);
			} else {
				// Show error
				frappe.msgprint({
					title: __('Submission Failed'),
					message: r.message?.message || r.message?.error || __('An error occurred'),
					indicator: 'red'
				});
			}
		},
		error: function(err) {
			frappe.msgprint({
				title: __('Error'),
				message: __('Failed to submit Material Request. Please try again.'),
				indicator: 'red'
			});
		}
	});
}

function redirect_to_success_page(docname, response_data) {
	// Store data in localStorage for the success page
	localStorage.setItem('mr_submission_data', JSON.stringify({
		docname: docname,
		workflow_state: response_data.workflow_state,
		approver_info: response_data.approver_info,
		timestamp: new Date().toISOString()
	}));

	// Redirect to success page
	frappe.set_route('mr-success', docname);
}
