/**
 * Custom Workspace Block: Open Tasks
 *
 * Displays all open tasks for the logged-in user in a scrollable view,
 * sorted by latest first, without pagination.
 *
 * Usage in Workspace:
 * Add an HTML block with the following content:
 * <div id="open-tasks-block"></div>
 * <script>
 frappe.require([
        '/assets/nexity_customization/js/open_tasks_block.js',
        '/assets/nexity_customization/css/open_tasks_block.css'
    ], function () {
        frappe.after_ajax(function () {
            if (window.renderOpenTasksBlock && root_element) {
                console.log("Shadow root:", root_element);
                window.renderOpenTasksBlock(root_element);
            }
        });
    });
 * </script>
 */

(function() {
	'use strict';

	/**
	 * Main function to render the open tasks block
	 * @param {string} containerId - ID of the container element
	 */
	window.renderOpenTasksBlock = function(root) {
    setTimeout(function () {
        if (!root) {
            console.error("Root element not found");
            return;
        }

        const container = root.querySelector('#open-tasks-block');
        if (!container) {
            console.error('open-tasks-block not found inside shadow root');
            return;
        }

        initializeTasksBlock(container);
    }, 100);
};

	/**
	 * Initialize the tasks block
	 * @param {HTMLElement} container - Container element
	 */
	function initializeTasksBlock(container) {

		// Show loading state
		container.innerHTML = `
			<div class="open-tasks-container">
				<div class="open-tasks-header">
					<h3>
						<span style="margin-right: 8px;">📋</span>
						My Open Tasks
					</h3>
					<button class="btn btn-xs btn-default refresh-tasks" title="Refresh" style="font-size: 16px;">
						🔄
					</button>
				</div>
				<div class="open-tasks-body">
					<div class="text-center text-muted" style="padding: 40px 20px;">
						<div class="spinner-border spinner-border-sm" role="status"></div>
						<p style="margin-top: 10px;">Loading tasks...</p>
					</div>
				</div>
			</div>
		`;

		// Fetch and render tasks
		fetchAndRenderTasks(container);

		// Add refresh button listener
		const refreshBtn = container.querySelector('.refresh-tasks');
		if (refreshBtn) {
			refreshBtn.addEventListener('click', function() {
				fetchAndRenderTasks(container);
			});
		}
	}

	/**
	 * Fetch tasks from backend and render them
	 * @param {HTMLElement} container - Container element
	 */
	function fetchAndRenderTasks(container) {
		frappe.call({
			method: 'nexity_customization.nexity_customization.api.tasks.get_open_tasks',
			callback: function(r) {
				if (r.message) {
					renderTasks(container, r.message);
				} else {
					showError(container, 'Failed to load tasks');
				}
			},
			error: function(err) {
				showError(container, 'Error loading tasks: ' + (err.message || 'Unknown error'));
			}
		});
	}

	/**
	 * Render the tasks list
	 * @param {HTMLElement} container - Container element
	 * @param {Array} tasks - Array of task objects
	 */
	function renderTasks(container, tasks) {
		const tasksBody = container.querySelector('.open-tasks-body');
		if (!tasksBody) return;

		if (!tasks || tasks.length === 0) {
			tasksBody.innerHTML = `
				<div class="text-center text-muted" style="padding: 40px 20px;">
					<div style="font-size: 48px; opacity: 0.3;">✓</div>
					<p style="margin-top: 10px;">No open tasks</p>
				</div>
			`;
			return;
		}

		// Build tasks HTML
		let tasksHTML = '<div class="tasks-list">';

		tasks.forEach(function(task) {
			const priorityClass = getPriorityClass(task.priority);
			const priorityLabel = task.priority || 'Medium';
			const statusClass = getStatusClass(task.status);
			const dueDate = task.exp_end_date ? frappe.datetime.str_to_user(task.exp_end_date) : 'No due date';
			const isOverdue = task.exp_end_date && frappe.datetime.get_diff(task.exp_end_date, frappe.datetime.get_today()) < 0;

			tasksHTML += `
				<div class="task-card" data-task="${task.name}">
					<div class="task-header">
						<div class="task-title">
							<a href="/app/task/${task.name}" class="task-link">
								${escapeHtml(task.subject || task.name)}
							</a>
						</div>
						<div class="task-badges">
							<span class="badge badge-sm ${priorityClass}">${priorityLabel}</span>
							<span class="badge badge-sm ${statusClass}">${task.status}</span>
						</div>
					</div>

					<div class="task-meta">
						${task.project ? `
							<span class="task-meta-item">
								<span style="opacity: 0.6;">📁</span>
								${escapeHtml(task.project)}
							</span>
						` : ''}
						<span class="task-meta-item ${isOverdue ? 'text-danger' : ''}">
							<span style="opacity: 0.6;">📅</span>
							${dueDate}
						</span>
					</div>

					${task.description_short ? `
						<div class="task-description">
							${escapeHtml(task.description_short)}
						</div>
					` : ''}

					${task.assigned_to && task.assigned_to.length > 0 ? `
						<div class="task-assigned">
							<span style="opacity: 0.6;">👤</span>
							${task.assigned_to.map(user => `<span class="assigned-user">${escapeHtml(user)}</span>`).join(' ')}
						</div>
					` : ''}
				</div>
			`;
		});

		tasksHTML += '</div>';
		tasksBody.innerHTML = tasksHTML;
	}

	/**
	 * Show error message
	 * @param {HTMLElement} container - Container element
	 * @param {string} message - Error message
	 */
	function showError(container, message) {
		const tasksBody = container.querySelector('.open-tasks-body');
		if (!tasksBody) return;

		tasksBody.innerHTML = `
			<div class="text-center text-danger" style="padding: 40px 20px;">
				<div style="font-size: 48px;">❌</div>
				<p style="margin-top: 10px;">${escapeHtml(message)}</p>
			</div>
		`;
	}

	/**
	 * Get priority badge class
	 * @param {string} priority - Priority level
	 * @returns {string} CSS class
	 */
	function getPriorityClass(priority) {
		const priorityMap = {
			'Low': 'badge-light-blue',
			'Medium': 'badge-light-gray',
			'High': 'badge-light-orange',
			'Urgent': 'badge-light-red'
		};
		return priorityMap[priority] || 'badge-light-gray';
	}

	/**
	 * Get status badge class
	 * @param {string} status - Task status
	 * @returns {string} CSS class
	 */
	function getStatusClass(status) {
		const statusMap = {
			'Open': 'badge-light-blue',
			'Working': 'badge-light-yellow',
			'Pending Review': 'badge-light-orange',
			'Overdue': 'badge-light-red',
			'Template': 'badge-light-gray'
		};
		return statusMap[status] || 'badge-light-gray';
	}

	/**
	 * Escape HTML to prevent XSS
	 * @param {string} text - Text to escape
	 * @returns {string} Escaped text
	 */
	function escapeHtml(text) {
		if (!text) return '';
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

})();
