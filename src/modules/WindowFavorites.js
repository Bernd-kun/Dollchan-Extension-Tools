/* ==[ WindowFavorites.js ]===================================================================================
                                              WINDOW: FAVORITES
=========================================================================================================== */

function saveRenewFavorites(favObj) {
	saveFavorites(favObj);
	toggleWindow('fav', true, favObj);
}

function removeFavEntry(favObj, h, b, num) {
	let f;
	if((h in favObj) && (b in favObj[h]) && (num in (f = favObj[h][b]))) {
		delete f[num];
		if(!(Object.keys(f).length - +$hasProp(f, 'url') - +$hasProp(f, 'hide'))) {
			delete favObj[h][b];
			if($isEmpty(favObj[h])) {
				delete favObj[h];
			}
		}
	}
}

function toggleThrFavBtn(h, b, num, isEnable) {
	if(h === aib.host && b === aib.b && pByNum.has(num)) {
		const post = pByNum.get(num);
		post.toggleFavBtn(isEnable);
		post.thr.isFav = isEnable;
	}
}

function updateFavorites(num, value, mode) {
	readFavorites().then(favObj => {
		let isUpdate = false;
		let f = favObj[aib.host];
		if(!f || !f[aib.b] || !(f = f[aib.b][num])) {
			return;
		}
		switch(mode) {
		case 'error':
			if(f.err !== value) {
				isUpdate = true;
			}
			f.err = value;
			break;
		case 'update':
			if(f.cnt !== value[0]) {
				isUpdate = true;
			}
			f.cnt = value[0];
			f.new = f.you = 0;
			f.last = aib.anchor + value[1];
		}
		const data = [aib.host, aib.b, num, value, mode];
		if(isUpdate) {
			updateFavWindow(...data);
			saveFavorites(favObj);
			sendStorageEvent('__de-favorites', data);
		}
	});
}

function updateFavWindow(h, b, num, value, mode) {
	if(mode === 'add' || mode === 'delete') {
		toggleThrFavBtn(h, b, num, mode === 'add');
		toggleWindow('fav', true, value);
		return;
	}
	const winEl = $q('#de-win-fav > .de-win-body');
	if(!winEl || !winEl.hasChildNodes()) {
		return;
	}
	const el = $q(`.de-entry[de-host="${ h }"][de-board="${ b }"][de-num="${ num }"] > .de-fav-inf`, winEl);
	if(!el) {
		return;
	}
	const [iconEl, youEl, newEl, oldEl] = [...el.children];
	$hide(youEl);
	$hide(newEl);
	if(mode === 'error') {
		iconEl.firstElementChild.setAttribute('class', 'de-fav-inf-icon de-fav-unavail');
		iconEl.title = value;
		return;
	}
	youEl.textContent = 0;
	newEl.textContent = 0;
	oldEl.textContent = value[0];
}

// Delete previously marked entries from Favorites
function cleanFavorites() {
	const els = $Q('.de-entry[de-removed]');
	const len = els.length;
	if(!len) {
		return;
	}
	readFavorites().then(favObj => {
		for(let i = 0; i < len; ++i) {
			const el = els[i];
			const h = el.getAttribute('de-host');
			const b = el.getAttribute('de-board');
			const num = +el.getAttribute('de-num');
			removeFavEntry(favObj, h, b, num);
			toggleThrFavBtn(h, b, num, false);
		}
		saveRenewFavorites(favObj);
	});
}

function showFavoritesWindow(body, favObj) {
	let html = '';
	// Create the list of favorite threads
	for(const h in favObj) {
		for(const b in favObj[h]) {
			const f = favObj[h][b];
			const hb = `de-host="${ h }" de-board="${ b }"`;
			const delBtn = `<span class="de-fav-del-btn">
				<svg><use xlink:href="#de-symbol-win-close"></use></svg>
			</span>`;
			let fArr, innerHtml = '';
			switch(Cfg.favThrOrder) {
			case 0: fArr = Object.entries(f); break;
			case 1: fArr = Object.entries(f).reverse(); break;
			case 2: fArr = Object.entries(f).sort((a, b) => (a[1].time || 0) - (b[1].time || 0)); break;
			case 3: fArr = Object.entries(f).sort((a, b) => (b[1].time || 0) - (a[1].time || 0));
			}
			for(let i = 0, len = fArr.length; i < len; ++i) {
				const tNum = fArr[i][0];
				if(tNum === 'url' || tNum === 'hide') {
					continue;
				}
				const t = f[tNum];
				if(!t.url.startsWith('http')) { // XXX: compatibility with older versions
					t.url = (h === aib.host ? aib.prot + '//' : 'http://') + h + t.url;
				}
				// Generate DOM for separate entry
				const favLinkHref = t.url + (
					!t.last ? '' :
					t.last.startsWith('#') ? t.last :
					h === aib.host ? aib.anchor + t.last : '');
				const favInfIwrapTitle = !t.err ? '' :
					t.err === 'Closed' ? `title="${ Lng.thrClosed[lang] }"` : `title="${ t.err }"`;
				const favInfIconClass = !t.err ? '' :
					t.err === 'Closed' || t.err === 'Archived' ? 'de-fav-closed' : 'de-fav-unavail';
				const favInfYouDisp = t.you ? '' : ' style="display: none;"';
				const favInfNewDisp = t.new ? '' : ' style="display: none;"';
				innerHtml += `<div class="de-entry ${ aib.cReply }" ${
					hb } de-num="${ tNum }" de-url="${ t.url }">
					${ delBtn }
					<a class="de-fav-link" title="${ Lng.goToThread[lang] }"` +
						` href="${ favLinkHref }" rel="noreferrer">${ tNum }</a>
					<div class="de-entry-title">- ${ t.txt }</div>
					<div class="de-fav-inf">
						<span class="de-fav-inf-iwrap" ${ favInfIwrapTitle }>
							<svg class="de-fav-inf-icon ${ favInfIconClass }">
								<use class="de-fav-closed-use" xlink:href="#de-symbol-closed"/>
								<use class="de-fav-unavail-use" xlink:href="#de-symbol-unavail"/>
								<use class="de-fav-wait-use" xlink:href="#de-symbol-wait"/>
							</svg>
						</span>
						<span class="de-fav-inf-you" title="${ Lng.myPostsRep[lang] }"${ favInfYouDisp }>
							${ t.you || 0 }</span>
						<span class="de-fav-inf-new" title="${ Lng.newPosts[lang] }"${ favInfNewDisp }>
							${ t.new || 0 }</span>
						<span class="de-fav-inf-old" title="${ Lng.oldPosts[lang] }">${ t.cnt }</span>
						<span class="de-fav-inf-page" title="${ Lng.thrPage[lang] }"></span>
					</div>
				</div>`;
			}
			if(!innerHtml) {
				continue;
			}
			const isHide = f.hide === undefined ? h !== aib.host : f.hide;
			// Building a foldable block for specific board
			html += `<div class="de-fold-block${ h === aib.host && b === aib.b ? ' de-fav-current' : '' }">
				<div class="de-fav-header">
					${ delBtn }
					<a class="de-fav-header-link" title="${ Lng.goToBoard[lang] }"` +
						` href="${ f.url }" rel="noreferrer">${ h }/${ b }</a>
					<a class="de-abtn de-fav-header-btn" title="${ Lng.toggleEntries[lang] }"` +
						` href="#">${ isHide ? '&#x25BC;' : '&#x25B2;' }</a>
				</div>
				<div class="de-fav-entries${ isHide ? ' de-fav-entries-hide' : '' }" ${ hb }>
					${ innerHtml }
				</div>
			</div>`;
		}
	}

	// Appending DOM and events
	if(html) {
		$bEnd(body, `<div class="de-fav-table">${ html }</div>`).addEventListener('click', e => {
			let el = fixEventEl(e.target);
			let parentEl = el.parentNode;
			if(el.tagName.toLowerCase() === 'svg') {
				el = parentEl;
				parentEl = parentEl.parentNode;
			}
			switch(el.className) {
			case 'de-fav-link':
				sesStorage['de-fav-win'] = '1'; // Favorites will open again after following a link
				// We need to scroll to last seen post after following a link,
				// remembering of scroll position is no longer needed
				sesStorage.removeItem('de-scroll-' +
					parentEl.getAttribute('de-board') + (parentEl.getAttribute('de-num') || ''));
				break;
			case 'de-fav-del-btn': {
				const wasChecked = el.getAttribute('de-checked') === '';
				const toggleFn = btnEl => toggleAttr(btnEl, 'de-checked', '', !wasChecked);
				toggleFn(el);
				if(parentEl.className === 'de-fav-header') {
					// Select/unselect all checkboxes in board block
					const entriesEl = parentEl.nextElementSibling;
					$each($Q('.de-fav-del-btn', entriesEl), toggleFn);
					if(!wasChecked && entriesEl.classList.contains('de-fav-entries-hide')) {
						entriesEl.classList.remove('de-fav-entries-hide');
					}
				}
				const isShowDelBtns = !!$q('.de-entry > .de-fav-del-btn[de-checked]', body);
				$toggle($id('de-fav-buttons'), !isShowDelBtns);
				$toggle($id('de-fav-del-confirm'), isShowDelBtns);
				break;
			}
			case 'de-abtn de-fav-header-btn': {
				const entriesEl = parentEl.nextElementSibling;
				const isHide = !entriesEl.classList.contains('de-fav-entries-hide');
				el.innerHTML = isHide ? '&#x25BC' : '&#x25B2';
				favObj[entriesEl.getAttribute('de-host')][entriesEl.getAttribute('de-board')].hide = isHide;
				saveFavorites(favObj);
				$pd(e);
				entriesEl.classList.toggle('de-fav-entries-hide');
			}
			}
		});
	} else {
		$bEnd(body, `<center><b>${ Lng.noFavThr[lang] }</b></center>`);
	}
	const btns = $bEnd(body, '<div id="de-fav-buttons"></div>');

	// "Edit" button. Calls a popup with editor to edit Favorites in JSON.
	btns.appendChild(getEditButton('favor',
		fn => readFavorites().then(favObj => fn(favObj, true, saveRenewFavorites))));

	// "Refresh" button. Updates counters of new posts for each thread entry.
	btns.appendChild($btn(Lng.refresh[lang], Lng.infoCount[lang], async () => {
		const favObj = await readFavorites();
		if(!favObj[aib.host]) {
			return;
		}
		let isUpdate = false;
		let last404 = false;
		const myposts = JSON.parse(locStorage['de-myposts'] || '{}');
		const els = $Q('.de-entry');
		for(let i = 0, len = els.length; i < len; ++i) {
			const el = els[i];
			const host = el.getAttribute('de-host');
			const b = el.getAttribute('de-board');
			const num = el.getAttribute('de-num');
			const f = favObj[host][b][num];
			// Updating doesn't works for other domains because of different posts structure
			// Updating is not needed in closed threads
			if(host !== aib.host || f.err === 'Closed' || f.err === 'Archived') {
				continue;
			}
			const [titleEl, youEl, countEl] = [...el.lastElementChild.children];
			const iconEl = titleEl.firstElementChild;
			// setAttribute for class is used because of SVG (for correct work in some browsers)
			iconEl.setAttribute('class', 'de-fav-inf-icon de-fav-wait');
			titleEl.title = Lng.updating[lang];
			let form, isArchived;
			try {
				if(!aib.hasArchive) {
					form = await ajaxLoad(aib.getThrUrl(b, num));
				} else {
					[form, isArchived] = await ajaxLoad(aib.getThrUrl(b, num), true, false, true);
				}
				last404 = false;
			} catch(err) {
				if((err instanceof AjaxError) && err.code === 404) { // Check for 404 error twice
					if(last404) {
						Thread.removeSavedData(b, num); // Not working yet
					} else {
						last404 = true;
						--i; // Repeat this cycle again
						continue;
					}
				}
				last404 = false;
				$hide(countEl);
				$hide(youEl);
				iconEl.setAttribute('class', 'de-fav-inf-icon de-fav-unavail');
				f.err = titleEl.title = getErrorMessage(err);
				isUpdate = true;
				continue;
			}
			if(aib.qClosed && $q(aib.qClosed, form)) { // Check for closed thread
				iconEl.setAttribute('class', 'de-fav-inf-icon de-fav-closed');
				titleEl.title = Lng.thrClosed[lang];
				f.err = 'Closed';
				isUpdate = true;
			} else if(isArchived) {
				iconEl.setAttribute('class', 'de-fav-inf-icon de-fav-closed');
				titleEl.title = Lng.thrArchived[lang];
				f.err = 'Archived';
				isUpdate = true;
			} else {
				// Thread is available and not closed
				iconEl.setAttribute('class', 'de-fav-inf-icon');
				titleEl.removeAttribute('title');
				if(f.err) { // Cancel error status if existed
					delete f.err;
					isUpdate = true;
				}
			}
			// Updating a counter of new posts
			const posts = $Q(aib.qRPost, form);
			const cnt = posts.length + 1 - f.cnt;
			countEl.textContent = cnt;
			if(cnt === 0) {
				$hide(countEl); // Hide counter if no new posts
				$hide(youEl);
			} else {
				$show(countEl);
				f.new = cnt;
				isUpdate = true;
				// Check for replies to my posts
				if(myposts && myposts[b]) {
					f.you = 0;
					for(let j = 0; j < cnt; ++j) {
						const links = $Q(aib.qPostMsg.split(', ').join(' a, ') + ' a',
							posts[posts.length - 1 - j]);
						for(let a = 0, len = links.length; a < len; ++a) {
							const tc = links[a].textContent;
							if(tc[0] === '>' && tc[1] === '>' && myposts[b][tc.substr(2)]) {
								f.you++;
							}
						}
					}
					if(f.you) {
						youEl.textContent = f.you;
						$show(youEl);
					}
				}
			}
		}
		AjaxCache.clearCache();
		if(isUpdate) {
			saveFavorites(favObj);
		}
	}));

	// "Page" button. Shows on which page every thread is existed.
	btns.appendChild($btn(Lng.page[lang], Lng.infoPage[lang], async () => {
		const els = $Q('.de-fav-current > .de-fav-entries > .de-entry');
		const len = els.length;
		if(!len) { // Cancel if no existed entries
			return;
		}
		$popup('load-pages', Lng.loading[lang], true);
		// Create indexed array of entries and "waiting" SVG icon for each entry
		const thrInfo = [];
		for(let i = 0; i < len; ++i) {
			const el = els[i];
			const iconEl = $q('.de-fav-inf-icon', el);
			const titleEl = iconEl.parentNode;
			thrInfo.push({
				found     : false,
				num       : +el.getAttribute('de-num'),
				pageEl    : $q('.de-fav-inf-page', el),
				iconClass : iconEl.getAttribute('class'),
				iconEl,
				iconTitle : titleEl.getAttribute('title'),
				titleEl
			});
			iconEl.setAttribute('class', 'de-fav-inf-icon de-fav-wait');
			titleEl.title = Lng.updating[lang];
		}
		// Sequentially load pages and search for favorites threads
		// We cannot know a count of pages while in the thread
		const endPage = (aib.lastPage || 10) + 1; // Check up to 10 page, if we don't know
		let infoLoaded = 0;
		const updateInf = (inf, page) => {
			inf.iconEl.setAttribute('class', inf.iconClass);
			toggleAttr(inf.titleEl, 'title', inf.iconTitle, inf.iconTitle);
			inf.pageEl.textContent = '@' + page;
		};
		for(let page = 0; page < endPage; ++page) {
			const tNums = new Set();
			try {
				const form = await ajaxLoad(aib.getPageUrl(aib.b, page));
				const els = DelForm.getThreads(form);
				for(let i = 0, len = els.length; i < len; ++i) {
					tNums.add(aib.getTNum(els[i]));
				}
			} catch(err) {
				continue;
			}
			// Search for threads on current page
			for(let i = 0; i < len; ++i) {
				const inf = thrInfo[i];
				if(tNums.has(inf.num)) {
					updateInf(inf, page);
					inf.found = true;
					infoLoaded++;
				}
			}
			if(infoLoaded === len) { // Stop pages loading when all favorite threads checked
				break;
			}
		}
		// Process missed threads that not found
		for(let i = 0; i < len; ++i) {
			const inf = thrInfo[i];
			if(!inf.found) {
				updateInf(inf, '?');
			}
		}
		closePopup('load-pages');
	}));

	// "Clear" button. Allows to clear 404'd threads.
	btns.appendChild($btn(Lng.clear[lang], Lng.clrDeleted[lang], async () => {
		// Sequentially load threads, and remove inaccessible
		let last404 = false;
		const els = $Q('.de-entry');
		const parent = $q('.de-fav-table');
		parent.classList.add('de-fav-table-unfold');
		for(let i = 0, len = els.length; i < len; ++i) {
			const el = els[i];
			const iconEl = $q('.de-fav-inf-icon', el);
			const titleEl = iconEl.parentNode;
			iconEl.setAttribute('class', 'de-fav-inf-icon de-fav-wait');
			titleEl.title = Lng.updating[lang];
			await $ajax(el.getAttribute('de-url'), null, true).then(xhr => {
				switch(el.getAttribute('de-host')) { // Makaba doesn't return 404
				case '2ch.hk':
				case '2ch.pm': {
					const dc = $DOM(xhr.responseText);
					if(dc && $q('.message-title', dc)) {
						throw new AjaxError(404, 'Error');
					}
				}
				}
				iconEl.setAttribute('class', 'de-fav-inf-icon');
				titleEl.removeAttribute('title');
				last404 = false;
			}).catch(err => {
				if(err.code === 404) { // Check for 404 error twice
					if(!last404) {
						last404 = true;
						--i; // Repeat this cycle again
						return;
					}
					Thread.removeSavedData(el.getAttribute('de-board'), // Not working yet
						+el.getAttribute('de-num'));
					el.setAttribute('de-removed', ''); // Mark an entry as deleted
				}
				iconEl.setAttribute('class', 'de-fav-inf-icon de-fav-unavail');
				titleEl.title = getErrorMessage(err);
				last404 = false;
			});
		}
		cleanFavorites(); // Delete marked entries
		parent.classList.remove('de-fav-table-unfold');
	}));

	// Deletion confirm/cancel buttons
	const delBtns = $bEnd(body, '<div id="de-fav-del-confirm" style="display: none;"></div>');
	delBtns.appendChild($btn(Lng.remove[lang], Lng.delEntries[lang], () => {
		$each($Q('.de-entry > .de-fav-del-btn[de-checked]', body),
			el => el.parentNode.setAttribute('de-removed', ''));
		cleanFavorites(); // Delete marked entries
		$show(btns);
		$hide(delBtns);
	}));
	delBtns.appendChild($btn(Lng.cancel[lang], '', () => {
		$each($Q('.de-fav-del-btn', body), el => el.removeAttribute('de-checked'));
		$show(btns);
		$hide(delBtns);
	}));
}
