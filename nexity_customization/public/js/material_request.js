frappe.ui.form.on('Material Request', {
	refresh: function(frm) {
		// Override the Submit button to show confirmation dialog
		if (frm.doc.docstatus === 0 && !frm.is_new()) {
			// Replace primary action
			frm.page.clear_primary_action();
			frm.page.set_primary_action(__('Submit'), function() {
				show_submit_confirmation(frm);
			});

			// Remove Submit from Actions dropdown - need to wait for Frappe to add it first
			setTimeout(() => {
				// Remove the Submit menu item from the dropdown
				frm.page.clear_actions_menu();

				// Re-add other standard actions except Submit
				frm.page.add_action_item(__('Help'), function() {
					frappe.help.show_video(frm.meta.documentation);
				});
			}, 200);
		}
	}
});

function show_submit_confirmation(frm) {
	// Build items summary
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
			// User confirmed - proceed with standard Frappe submit
			frm.savesubmit().then(() => {
				// After successful submit, optionally redirect to success page
				frappe.call({
					method: 'nexity_customization.nexity_customization.api.material_request.get_next_approver_info',
					args: {
						docname: frm.doc.name
					},
					callback: function(r) {
						if (r.message && !r.message.error) {
							redirect_to_success_page(frm.doc.name, r.message);
						}
					}
				});
			});
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

function redirect_to_success_page(docname, response_data) {
	// Store data in localStorage for the success page
	localStorage.setItem('mr_submission_data', JSON.stringify({
		docname: docname,
		workflow_state: response_data.current_state,
		approver_info: response_data.next_approver,
		timestamp: new Date().toISOString()
	}));

	// Redirect to success page
	frappe.set_route('mr-success', docname);
}
