/**
 * Custom Workspace Block: My Tasks (ToDos)
 *
 * Modern card-based UI with sorting and seen tracking
 */

(function() {
	'use strict';

	// State management
	let currentStart = 0;
	let hasMore = true;
	let isLoading = false;
	let allTodos = [];
	let currentSortOrder = 'latest';

	/**
	 * SVG Icons (inline for shadow DOM compatibility)
	 */
	const icons = {
		check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
		package: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
		shoppingCart: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
		calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
		file: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
		alertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
		fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
		user: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
		link: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
		xCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
	};

	/**
	 * Icon map for different reference types
	 */
	function getIconForType(refType) {
		const iconTypeMap = {
			'Material Request': icons.package,
			'Purchase Order': icons.shoppingCart,
			'Leave Application': icons.calendar,
			'Document': icons.fileText,
			'Task': icons.check,
			'Issue': icons.alertCircle,
			'Project': icons.fileText,
			'Sales Order': icons.shoppingCart,
			'Quotation': icons.fileText
		};
		return iconTypeMap[refType] || icons.file;
	}

	/**
	 * Get left border color
	 */
	function getLeftBorderColor(todo) {
		if (todo.status === 'Pending') return 'border-pending';
		if (todo.is_overdue) return 'border-overdue';
		if (todo.priority === 'High' || todo.priority === 'Urgent') return 'border-high';
		return 'border-default';
	}

	/**
	 * Main render function
	 */
	window.renderOpenTasksBlock = function(root) {
		setTimeout(function() {
			if (!root) {
				console.error("Root element not found");
				return;
			}

			const container = root.querySelector('#open-tasks-block');
			if (!container) {
				console.error('open-tasks-block not found inside shadow root');
				return;
			}

			initializeTodosBlock(container);
		}, 100);
	};

	/**
	 * Initialize the block
	 */
	function initializeTodosBlock(container) {
		currentStart = 0;
		hasMore = true;
		isLoading = false;
		allTodos = [];
		currentSortOrder = 'latest';

		container.innerHTML = `
			<div class="my-tasks-container">
				<div class="my-tasks-header">
					<div class="header-left">
						<div class="header-icon">${icons.check}</div>
						<h2 class="header-title">My Tasks</h2>
					</div>
				</div>
				<div class="my-tasks-filters">
					<button class="filter-btn filter-btn-active" data-sort="latest">
						Latest First
					</button>
					<button class="filter-btn" data-sort="oldest">
						Oldest First
					</button>
				</div>
				<div class="my-tasks-body" id="todos-body">
					<div class="loading-state">
						<div class="spinner-border spinner-border-sm"></div>
						<p>Loading tasks...</p>
					</div>
				</div>
				<div class="view-all-tasks" id="view-all-footer" style="display: none;">
					<a href="/app/todo?allocated_to=${encodeURIComponent(frappe.session.user)}" class="view-all-link">View All Tasks →</a>
				</div>
			</div>
		`;

		const filterBtns = container.querySelectorAll('.filter-btn');
		filterBtns.forEach(btn => {
			btn.addEventListener('click', function() {
				const sortOrder = this.getAttribute('data-sort');
				if (sortOrder !== currentSortOrder) {
					changeSortOrder(container, sortOrder);
				}
			});
		});

		fetchTodos(container, true);

		const todosBody = container.querySelector('.my-tasks-body');
		if (todosBody) {
			todosBody.addEventListener('scroll', function() {
				handleScroll(container, todosBody);
			});
		}
	}

	/**
	 * Change sort order
	 */
	function changeSortOrder(container, sortOrder) {
		currentSortOrder = sortOrder;
		currentStart = 0;
		allTodos = [];
		hasMore = true;

		const filterBtns = container.querySelectorAll('.filter-btn');
		filterBtns.forEach(btn => {
			if (btn.getAttribute('data-sort') === sortOrder) {
				btn.classList.add('filter-btn-active');
			} else {
				btn.classList.remove('filter-btn-active');
			}
		});

		const todosBody = container.querySelector('.my-tasks-body');
		if (todosBody) {
			todosBody.innerHTML = `
				<div class="loading-state">
					<div class="spinner-border spinner-border-sm"></div>
					<p>Loading tasks...</p>
				</div>
			`;
		}

		fetchTodos(container, true);
	}

	/**
	 * Handle scroll
	 */
	function handleScroll(container, todosBody) {
		if (isLoading || !hasMore) return;

		const scrollTop = todosBody.scrollTop;
		const scrollHeight = todosBody.scrollHeight;
		const clientHeight = todosBody.clientHeight;

		if (scrollTop + clientHeight >= scrollHeight - 50) {
			fetchTodos(container, false);
		}
	}

	/**
	 * Fetch todos
	 */
	function fetchTodos(container, isInitial) {
		if (isLoading) return;
		isLoading = true;

		if (!isInitial) {
			appendLoadingIndicator(container);
		}

		frappe.call({
			method: 'nexity_customization.nexity_customization.api.tasks.get_open_todos',
			args: {
				start: currentStart,
				page_length: 15,
				sort_order: currentSortOrder
			},
			callback: function(r) {
				isLoading = false;
				removeLoadingIndicator(container);

				if (r.message && r.message.todos) {
					const data = r.message;
					hasMore = data.has_more;
					currentStart = data.next_start;

					allTodos = allTodos.concat(data.todos);
					renderTodos(container, allTodos, hasMore);
				} else {
					if (isInitial) {
						showError(container, 'Failed to load tasks');
					}
				}
			},
			error: function(err) {
				isLoading = false;
				removeLoadingIndicator(container);
				if (isInitial) {
					showError(container, 'Error loading tasks');
				}
			}
		});
	}

	/**
	 * Render todos
	 */
	function renderTodos(container, todos, hasMore) {
		const todosBody = container.querySelector('.my-tasks-body');
		if (!todosBody) return;

		if (!todos || todos.length === 0) {
			todosBody.innerHTML = `
				<div class="empty-state">
					<div class="empty-icon">${icons.check}</div>
					<p>No open tasks</p>
				</div>
			`;
			return;
		}

		let html = '<div class="tasks-list">';

		todos.forEach(function(todo) {
			const icon = getIconForType(todo.reference_type);
			const isSeenClass = todo.is_seen ? 'task-card-seen' : '';
			const isRejectedClass = todo.is_rejected ? 'task-card-rejected' : '';
			const timeAgo = todo.time_ago || '';

			// Extract rejection info
			const desc = (todo.description_short || '').toLowerCase();
			let rejectionInfo = '';
			if (desc.includes('rejected') || desc.includes('returned')) {
				const match = todo.description_short.match(/(?:Rejected|Returned) by ([^on]+) on (.+)/i);
				if (match) {
					rejectionInfo = `<span class="task-rejected-info"><span class="status-icon">${icons.xCircle}</span>Rejected by ${escapeHtml(match[1])}</span>`;
				}
			}

			html += `
				<div class="task-card ${isSeenClass} ${isRejectedClass}" data-todo="${todo.name}" data-seen="${todo.is_seen}" data-ref-link="${todo.reference_link || ''}">
					<div class="task-card-border ${getLeftBorderColor(todo)}"></div>
					<div class="task-card-content">
						<div class="task-card-header">
							<div class="task-icon">${icon}</div>
							<div class="task-main">
								<div class="task-meta-row">
									${todo.reference_name ? `<span class="task-ref-id">${escapeHtml(todo.reference_name)}</span>` : ''}
									${rejectionInfo}
									${todo.assigned_by_name && !rejectionInfo ? `<span class="task-assigned-inline"><span class="assigned-icon">${icons.user}</span>${escapeHtml(todo.assigned_by_label || 'Raised by')}: ${escapeHtml(todo.assigned_by_name)}</span>` : ''}
									${!todo.is_seen ? `<span class="new-badge">New</span>` : ''}
									${timeAgo ? `<span class="task-time">${escapeHtml(timeAgo)}</span>` : ''}
								</div>
								<h3 class="task-title">${escapeHtml(todo.description_short || 'Untitled Task')}</h3>
								${todo.due_text && !todo.is_rejected ? `
									<div class="task-due-date ${todo.is_overdue ? 'due-overdue' : 'due-upcoming'}">
										<span class="due-icon">${icons.calendar}</span>
										<span class="due-text">${escapeHtml(todo.due_text)}</span>
									</div>
								` : ''}
							</div>
						</div>
					</div>
				</div>
			`;
		});

		html += '</div>';

		todosBody.innerHTML = html;

		// Show/hide the footer based on hasMore
		const footer = container.querySelector('#view-all-footer');
		if (footer) {
			footer.style.display = hasMore ? 'none' : 'block';
		}

		const taskCards = todosBody.querySelectorAll('.task-card');
		taskCards.forEach(card => {
			card.addEventListener('click', function(e) {
				// Don't handle click if clicking on a link
				if (e.target.tagName === 'A' || e.target.closest('a')) return;

				const todoName = this.getAttribute('data-todo');
				const isSeen = this.getAttribute('data-seen') === 'true';
				const refLink = this.getAttribute('data-ref-link');

				// Mark as seen
				if (!isSeen) {
					markAsSeen(this, todoName);
				}

				// Navigate to reference document if available, otherwise to todo
				if (refLink && refLink !== '') {
					window.location.href = refLink;
				} else {
					// Fallback to todo if no reference link
					window.location.href = `/app/todo/${todoName}`;
				}
			});
		});
	}

	/**
	 * Mark as seen
	 */
	function markAsSeen(cardElement, todoName) {
		frappe.call({
			method: 'nexity_customization.nexity_customization.api.tasks.mark_todo_as_seen',
			args: { todo_name: todoName },
			callback: function(r) {
				if (r.message && r.message.success) {
					cardElement.classList.add('task-card-seen');
					cardElement.setAttribute('data-seen', 'true');
				}
			}
		});
	}

	function appendLoadingIndicator(container) {
		const todosBody = container.querySelector('.my-tasks-body');
		if (!todosBody) return;

		let loadingDiv = todosBody.querySelector('.loading-more');
		if (!loadingDiv) {
			loadingDiv = document.createElement('div');
			loadingDiv.className = 'loading-more';
			loadingDiv.innerHTML = '<div class="spinner-border spinner-border-sm"></div><p>Loading more...</p>';
			todosBody.appendChild(loadingDiv);
		}
	}

	function removeLoadingIndicator(container) {
		const todosBody = container.querySelector('.my-tasks-body');
		if (!todosBody) return;

		const loadingDiv = todosBody.querySelector('.loading-more');
		if (loadingDiv) loadingDiv.remove();
	}

	function showError(container, message) {
		const todosBody = container.querySelector('.my-tasks-body');
		if (!todosBody) return;

		todosBody.innerHTML = `
			<div class="error-state">
				<p>${escapeHtml(message)}</p>
			</div>
		`;
	}

	function escapeHtml(text) {
		if (!text) return '';
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

})();
