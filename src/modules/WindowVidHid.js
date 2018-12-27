/* ==[ WindowVidHid.js ]======================================================================================
                                        WINDOW: VIDEOS, HIDDEN THREADS
=========================================================================================================== */

function showVideosWindow(body) {
	const els = $Q('.de-video-link');
	if(!els.length) {
		body.innerHTML = `<b>${ Lng.noVideoLinks[lang] }</b>`;
		return;
	}
	if(!$id('de-ytube-api')) {
		// YouTube APT script. We can't insert scripts directly as html.
		const script = doc.createElement('script');
		script.type = 'text/javascript';
		script.src = aib.prot + '//www.youtube.com/player_api';
		doc.head.appendChild(script).id = 'de-ytube-api';
	}
	body.innerHTML = `<div de-disableautoplay class="de-video-obj"></div>
	<div id="de-video-buttons">
		<a class="de-abtn" id="de-video-btn-prev" href="#" title="${ Lng.prevVideo[lang] }">&#x25C0;</a>
		<a class="de-abtn" id="de-video-btn-resize" href="#" title="${ Lng.expandVideo[lang] }"></a>
		<a class="de-abtn" id="de-video-btn-next" href="#" title="${ Lng.nextVideo[lang] }">&#x25B6;</a>
		<a class="de-abtn" id="de-video-btn-hide" href="#" title="${ Lng.hideLnkList[lang] }">&#x25B2;</a>
	</div>`;
	const linkList = $add(`<div id="de-video-list" style="max-width: ${
		+Cfg.YTubeWidth + 40 }px; max-height: ${
		nav.viewportHeight() * 0.92 - +Cfg.YTubeHeigh - 82 }px;"></div>`);

	// A script to detect the end of current video playback, and auto play next. Uses YouTube API.
	// The first video should not start automatically!
	const script = doc.createElement('script');
	script.type = 'text/javascript';
	script.textContent = `(function() {
		if('YT' in window && 'Player' in window.YT) {
			onYouTubePlayerAPIReady();
		} else {
			window.onYouTubePlayerAPIReady = onYouTubePlayerAPIReady;
		}
		function onYouTubePlayerAPIReady() {
			window.de_addVideoEvents =
				addEvents.bind(document.querySelector('#de-win-vid > .de-win-body > .de-video-obj'));
			window.de_addVideoEvents();
		}
		function addEvents() {
			var autoplay = true;
			if(this.hasAttribute('de-disableautoplay')) {
				autoplay = false;
				this.removeAttribute('de-disableautoplay');
			}
			new YT.Player(this.firstChild, { events: {
				'onError': gotoNextVideo,
				'onReady': autoplay ? function(e) {
					e.target.playVideo();
				} : Function.prototype,
				'onStateChange': function(e) {
					if(e.data === 0) {
						gotoNextVideo();
					}
				}
			}});
		}
		function gotoNextVideo() {
			document.getElementById("de-video-btn-next").click();
		}
	})();`;
	body.appendChild(script);

	// Events for control buttons
	body.addEventListener('click', {
		linkList,
		currentLink : null,
		listHidden  : false,
		player      : body.firstElementChild,
		playerInfo  : null,
		handleEvent(e) {
			const el = e.target;
			if(el.classList.contains('de-abtn')) {
				let node;
				switch(el.id) {
				case 'de-video-btn-hide': { // Fold/unfold list of links
					const isHide = this.listHidden = !this.listHidden;
					$toggle(this.linkList, !isHide);
					el.textContent = isHide ? '\u25BC' : '\u25B2';
					break;
				}
				case 'de-video-btn-prev': // Play previous video
					node = this.currentLink.parentNode;
					node = node.previousElementSibling || node.parentNode.lastElementChild;
					node.lastElementChild.click();
					break;
				case 'de-video-btn-next': // Play next video
					node = this.currentLink.parentNode;
					node = node.nextElementSibling || node.parentNode.firstElementChild;
					node.lastElementChild.click();
					break;
				case 'de-video-btn-resize': { // Expand/collapse video player
					const exp = this.player.className === 'de-video-obj';
					this.player.className = exp ? 'de-video-obj de-video-expanded' : 'de-video-obj';
					this.linkList.style.maxWidth = `${ exp ? 894 : +Cfg.YTubeWidth + 40 }px`;
					this.linkList.style.maxHeight = `${ nav.viewportHeight() * 0.92 -
						(exp ? 562 : +Cfg.YTubeHeigh + 82) }px`;
				}
				}
				$pd(e);
				return;
			} else if(!el.classList.contains('de-video-link')) { // Clicking on ">" before link
				// Go to post that contains this link
				pByNum.get(+el.getAttribute('de-num')).selectAndScrollTo();
				return;
			}
			const info = el.videoInfo;
			if(this.playerInfo !== info) { // Prevents same link clicking
				// Mark new link as a current and add player for it
				if(this.currentLink) {
					this.currentLink.classList.remove('de-current');
				}
				this.currentLink = el;
				el.classList.add('de-current');
				Videos.addPlayer(this, info, el.classList.contains('de-ytube'), true);
			}
			$pd(e);
		}
	}, true);

	// Copy all video links into videos list
	for(let i = 0, len = els.length; i < len; ++i) {
		updateVideoList(linkList, els[i], aib.getPostOfEl(els[i]).num);
	}
	body.appendChild(linkList);
	$q('.de-video-link', linkList).click();
}

function updateVideoList(parent, link, num) {
	const el = link.cloneNode(true);
	el.videoInfo = link.videoInfo;
	$bEnd(parent, `<div class="de-entry ${ aib.cReply }">
		<a class="de-video-refpost" title=">>${ num }" de-num="${ num }">&gt;&gt;</a>
	</div>`).appendChild(el).classList.remove('de-current');
	el.setAttribute('onclick', 'window.de_addVideoEvents && window.de_addVideoEvents();');
}

// HIDDEN THREADS WINDOW
function showHiddenWindow(body) {
	const hThr = HiddenThreads.getRawData();
	const hasThreads = !$isEmpty(hThr);
	if(hasThreads) {
		// Generate DOM for the list of hidden threads
		for(const b in hThr) {
			if($isEmpty(hThr[b])) {
				continue;
			}
			const block = $bEnd(body,
				`<div class="de-fold-block"><input type="checkbox"><b>/${ b }</b></div>`);
			block.firstChild.onclick =
				e => $each($Q('.de-entry > input', block), el => (el.checked = e.target.checked));
			for(const tNum in hThr[b]) {
				$bEnd(block, `<div class="de-entry ${ aib.cReply }" info="${ b };${ tNum }">
					<input type="checkbox">
					<a href="${ aib.getThrUrl(b, tNum) }" target="_blank">${ tNum }</a>
					<div class="de-entry-title">- ${ hThr[b][tNum][2] }</div>
				</div>`);
			}
		}
	}
	const btns = $bEnd(body, (!hasThreads ? `<center><b>${ Lng.noHidThr[lang] }</b></center>` : '') +
		'<div id="de-hid-buttons"></div>');

	// "Edit" button. Calls a popup with editor to edit Hidden in JSON.
	btns.appendChild(getEditButton('hidden', fn => fn(HiddenThreads.getRawData(), true, data => {
		HiddenThreads.saveRawData(data);
		Thread.first.updateHidden(data[aib.b]);
		toggleWindow('hid', true);
	})));

	// "Clear" button. Allows to clear 404'd threads.
	btns.appendChild($btn(Lng.clear[lang], Lng.clrDeleted[lang], async e => {
		// Sequentially load threads, and remove inaccessible
		const els = $Q('.de-entry[info]', e.target.parentNode.parentNode);
		for(let i = 0, len = els.length; i < len; ++i) {
			const [b, tNum] = els[i].getAttribute('info').split(';');
			await $ajax(aib.getThrUrl(b, tNum)).catch(err => {
				if(err.code === 404) {
					HiddenThreads.removeStorage(tNum, b);
					HiddenPosts.removeStorage(tNum, b);
				}
			});
		}
		toggleWindow('hid', true);
	}));

	// "Delete" button. Allows to delete selected threads
	btns.appendChild($btn(Lng.remove[lang], Lng.delEntries[lang], () => {
		$each($Q('.de-entry[info]', body), el => {
			if(!$q('input', el).checked) {
				return;
			}
			const [brd, tNum] = el.getAttribute('info').split(';');
			const num = +tNum;
			if(pByNum.has(num)) {
				pByNum.get(num).setUserVisib(false);
			} else {
				sendStorageEvent('__de-post', { brd, num, hide: false, thrNum: num });
			}
			HiddenThreads.removeStorage(num, brd);
			HiddenPosts.set(num, num, false); // Actually unhide thread by its oppost
		});
		toggleWindow('hid', true);
	}));
}
