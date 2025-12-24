frappe.pages['mr-success'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Material Request Submitted',
		single_column: true
	});

	// Add custom buttons to the page
	// page.add_inner_button(__('New Material Request'), function() {
	// 	frappe.new_doc('Material Request');
	// }, __('Actions'));

	// page.add_inner_button(__('View Dashboard'), function() {
	// 	frappe.set_route('List', 'Material Request');
	// }, __('Actions'));

	page.success_view = new MRSuccessView(page);
	page.success_view.show();
}

class MRSuccessView {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.docname = frappe.get_route()[1];
	}

	show() {
		this.wrapper.empty();
		this.load_data();
	}

	load_data() {
		// Try to get data from localStorage first (set by client script)
		const stored_data = localStorage.getItem('mr_submission_data');
		let data = null;

		if (stored_data) {
			try {
				data = JSON.parse(stored_data);
				// Check if data is for current docname and not too old (5 minutes)
				const timestamp = new Date(data.timestamp);
				const now = new Date();
				const age_minutes = (now - timestamp) / 1000 / 60;

				if (data.docname === this.docname && age_minutes < 5) {
					this.render(data);
					// Clear the stored data
					localStorage.removeItem('mr_submission_data');
					return;
				}
			} catch (e) {
				console.error('Error parsing stored data:', e);
			}
		}

		// If no valid stored data, fetch from server
		this.fetch_data();
	}

	fetch_data() {
		frappe.call({
			method: 'nexity_customization.nexity_customization.api.material_request.get_next_approver_info',
			args: {
				docname: this.docname
			},
			callback: (r) => {
				if (r.message) {
					this.render({
						docname: this.docname,
						workflow_state: r.message.current_state,
						approver_info: r.message
					});
				} else {
					this.render_error();
				}
			},
			error: () => {
				this.render_error();
			}
		});
	}

	render(data) {
		const info = data.approver_info;

		// Build approver list
		let approver_html = '';
		if (info.next_states && info.next_states.length > 0) {
			info.next_states.forEach(state => {
				approver_html += `
					<div class="approver-section mb-3">
						<div class="approver-action">
							<strong>${state.action}</strong> → ${state.next_state}
						</div>
						<div class="approver-role text-muted small">
							Required Role: ${state.allowed_role}
						</div>
						${state.approvers && state.approvers.length > 0 ? `
							<div class="approvers-list mt-2">
								${state.approvers.map(app => `
									<div class="approver-item">
										<i class="fa fa-user"></i>
										<span>${app.full_name}</span>
										<span class="text-muted small">(${app.email})</span>
									</div>
								`).join('')}
							</div>
						` : '<div class="text-muted small mt-1">No active approvers found</div>'}
					</div>
				`;
			});
		} else {
			approver_html = '<div class="text-muted">No pending approvals required</div>';
		}

		const html = `
			<div class="mr-success-container">
				<!-- Success Header -->
					<!-- Action Buttons -->
				<div class="action-buttons">
					<button class="btn btn-primary btn-lg btn-new-request">
						<i class="fa fa-plus"></i> Submit New Request
					</button>
					<button class="btn btn-default btn-lg btn-dashboard">
						<i class="fa fa-th-list"></i> View Dashboard
					</button>
					<button class="btn btn-secondary btn-lg btn-view-request">
						<i class="fa fa-eye"></i> View This Request
					</button>
				</div>
				
				<div class="success-header">
					<div class="success-icon">
						<svg width="80" height="80" viewBox="0 0 80 80" fill="none">
							<circle cx="40" cy="40" r="40" fill="#10b981" opacity="0.1"/>
							<circle cx="40" cy="40" r="32" fill="#10b981"/>
							<path d="M26 40L35 49L54 30" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<h2 class="success-title">Material Request Submitted Successfully!</h2>
					<p class="success-subtitle">Your request has been submitted and is awaiting approval</p>
				</div>

				<!-- Request Details Card -->
				<div class="detail-card">
					<div class="card-header">
						<h4><i class="fa fa-file-text"></i> Request Details</h4>
					</div>
					<div class="card-body">
						<div class="detail-row">
							<span class="detail-label">Request ID:</span>
							<span class="detail-value">
								<a href="/app/material-request/${this.docname}" class="text-primary">
									<strong>${this.docname}</strong>
								</a>
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Current Status:</span>
							<span class="detail-value">
								<span class="badge badge-info">${data.workflow_state || 'Submitted'}</span>
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Request Type:</span>
							<span class="detail-value">${info.material_request_type || '-'}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Company:</span>
							<span class="detail-value">${info.company || '-'}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Required By:</span>
							<span class="detail-value">${info.schedule_date ? frappe.datetime.str_to_user(info.schedule_date) : '-'}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Total Quantity:</span>
							<span class="detail-value">${info.total_qty || 0}</span>
						</div>
					</div>
				</div>

				<!-- Next Approver Card -->
				<div class="detail-card">
					<div class="card-header">
						<h4><i class="fa fa-users"></i> Next Approver Information</h4>
					</div>
					<div class="card-body">
						${approver_html}
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="action-buttons">
					<button class="btn btn-primary btn-lg btn-new-request">
						<i class="fa fa-plus"></i> Submit New Request
					</button>
					<button class="btn btn-default btn-lg btn-dashboard">
						<i class="fa fa-th-list"></i> View Dashboard
					</button>
					<button class="btn btn-secondary btn-lg btn-view-request">
						<i class="fa fa-eye"></i> View This Request
					</button>
				</div>

				<!-- Next Steps Info -->
				<div class="next-steps-info">
					<p><i class="fa fa-info-circle"></i> <strong>What happens next?</strong></p>
					<ul>
						<li>Your request will be reviewed by the designated approver(s)</li>
						<li>You will receive email notifications about status changes</li>
						<li>You can track the progress in the Material Request dashboard</li>
					</ul>
				</div>
			</div>
		`;

		this.wrapper.html(html);
		this.bind_events();
	}

	render_error() {
		const html = `
			<div class="mr-success-container">
				<div class="alert alert-warning">
					<h4>Could not load submission details</h4>
					<p>The Material Request was submitted, but we couldn't load the details.</p>
					<a href="/app/material-request/${this.docname}" class="btn btn-primary">
						View Request
					</a>
				</div>
			</div>
		`;
		this.wrapper.html(html);
	}

	bind_events() {
		this.wrapper.find('.btn-new-request').on('click', () => {
			frappe.new_doc('Material Request');
		});

		this.wrapper.find('.btn-dashboard').on('click', () => {
			frappe.set_route('List', 'Material Request');
		});

		this.wrapper.find('.btn-view-request').on('click', () => {
			frappe.set_route('Form', 'Material Request', this.docname);
		});
	}
}
