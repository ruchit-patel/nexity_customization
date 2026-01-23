frappe.ui.form.on('Material Request', {
	refresh: function(frm) {
		// Only show custom confirmation for initial submission (Draft state)
		// Approvers and other workflow states use standard workflow buttons
		const is_initial_draft = frm.doc.docstatus === 0 &&
		                          !frm.is_new() &&
		                          (!frm.doc.workflow_state || frm.doc.workflow_state === 'Draft');

		if (is_initial_draft) {
			// Get the dynamic button label from workflow
			get_workflow_action_for_submit(frm).then((action_name) => {
				const button_label = action_name || __('Submit');

				// Add primary action button (outside)
				frm.page.clear_primary_action();
				frm.page.set_primary_action(button_label, function() {
					show_submit_confirmation(frm);
				});

				// Also add the same button inside Actions dropdown
				setTimeout(() => {
					frm.page.clear_actions_menu();

					// Add Submit button inside Actions menu
					frm.page.add_action_item(button_label, function() {
						show_submit_confirmation(frm);
					});

					// Add Help option
					frm.page.add_action_item(__('Help'), function() {
						frappe.help.show_video(frm.meta.documentation);
					});
				}, 200);
			});
		}
		// For all other workflow states, Frappe's standard workflow buttons will appear
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
				Once submitted, this request will be sent to the approver.
			</p>
		</div>
	`;

	frappe.confirm(
		confirmation_html,
		function() {
			// User confirmed - get workflow action dynamically and apply it
			get_workflow_action_for_submit(frm).then((action_name) => {
				if (!action_name) {
					// No workflow configured, use standard submit
				
						show_success_and_redirect(frm);
					
					return;
				}

				// Save first, then apply workflow action
		
					frappe.xcall('frappe.model.workflow.apply_workflow', {
						doc: frm.doc,
						action: action_name
					}).then(() => {
						frm.reload_doc();
						show_success_and_redirect(frm);
					}).catch((err) => {
						frappe.msgprint({
							title: __('Error'),
							message: __('Failed to submit Material Request: {0}', [err.message || err]),
							indicator: 'red'
						});
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

function get_workflow_action_for_submit(frm) {
	// Get the first available workflow action from current state
	return new Promise((resolve) => {
		if (!frm.doc.workflow_state) {
			// Check if workflow is assigned to this doctype
			frappe.db.get_value('Workflow', {
				document_type: 'Material Request',
				is_active: 1
			}, 'name').then((r) => {
				if (r && r.message && r.message.name) {
					// Workflow exists, get first transition from Draft state
					frappe.call({
						method: 'frappe.client.get',
						args: {
							doctype: 'Workflow',
							name: r.message.name
						},
						callback: function(workflow_data) {
							if (workflow_data.message && workflow_data.message.transitions) {
								// Find first transition from Draft state (or current state)
								const current_state = frm.doc.workflow_state || 'Draft';
								const transition = workflow_data.message.transitions.find(
									t => t.state === current_state
								);
								resolve(transition ? transition.action : null);
							} else {
								resolve(null);
							}
						}
					});
				} else {
					resolve(null);
				}
			});
		} else {
			// Workflow state exists, get available actions
			frappe.call({
				method: 'frappe.client.get_value',
				args: {
					doctype: 'Workflow',
					filters: {
						document_type: 'Material Request',
						is_active: 1
					},
					fieldname: 'name'
				},
				callback: function(r) {
					if (r.message && r.message.name) {
						frappe.call({
							method: 'frappe.client.get',
							args: {
								doctype: 'Workflow',
								name: r.message.name
							},
							callback: function(workflow_data) {
								if (workflow_data.message && workflow_data.message.transitions) {
									const transition = workflow_data.message.transitions.find(
										t => t.state === frm.doc.workflow_state
									);
									resolve(transition ? transition.action : null);
								} else {
									resolve(null);
								}
							}
						});
					} else {
						resolve(null);
					}
				}
			});
		}
	});
}

function show_success_and_redirect(frm) {
	// After successful submit/workflow action, redirect to success page
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
