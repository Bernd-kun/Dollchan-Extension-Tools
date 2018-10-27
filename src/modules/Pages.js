/* ==[ Pages.js ]=============================================================================================
                                                 PAGES LOADER
=========================================================================================================== */

const Pages = {
	addPage() {
		const pageNum = DelForm.last.pageNum + 1;
		if(this._isAdding || pageNum > aib.lastPage) {
			return;
		}
		this._isAdding = true;
		DelForm.last.el.insertAdjacentHTML('beforeend', '<div class="de-addpage-wait"><hr>' +
			`<svg class="de-wait"><use xlink:href="#de-symbol-wait"/></svg>${ Lng.loading[lang] }</div>`);
		MyPosts.purge();
		this._addingPromise = ajaxLoad(aib.getPageUrl(aib.b, pageNum)).then(formEl => {
			if(this._addForm(formEl, pageNum).firstThr) {
				return this._updateForms(DelForm.last);
			}
			this._endAdding();
			this.addPage();
			return CancelablePromise.reject(new CancelError());
		}).then(() => this._endAdding()).catch(err => {
			if(!(err instanceof CancelError)) {
				$popup('add-page', getErrorMessage(err));
				this._endAdding();
			}
		});
	},
	async loadPages(count) {
		$popup('load-pages', Lng.loading[lang], true);
		if(this._addingPromise) {
			this._addingPromise.cancelPromise();
			this._endAdding();
		}
		PviewsCache.purge();
		isExpImg = false;
		pByEl = new Map();
		pByNum = new Map();
		Post.hiddenNums = new Set();
		AttachedImage.closeImg();
		if(pr.isQuick) {
			pr.clearForm();
		}
		DelForm.tNums = new Set();
		for(const form of DelForm) {
			$each($Q('a[href^="blob:"]', form.el), el => URL.revokeObjectURL(el.href));
			$hide(form.el);
			if(form === DelForm.last) {
				break;
			}
			$del(form.el);
		}
		DelForm.first = DelForm.last;
		for(let i = aib.page, len = Math.min(aib.lastPage + 1, aib.page + count); i < len; ++i) {
			try {
				this._addForm(await ajaxLoad(aib.getPageUrl(aib.b, i)), i);
			} catch(err) {
				$popup('load-pages', getErrorMessage(err));
			}
		}
		const { first } = DelForm;
		if(first !== DelForm.last) {
			DelForm.first = first.next;
			$del(first.el);
			await this._updateForms(DelForm.first);
			closePopup('load-pages');
		}
	},

	_isAdding      : false,
	_addingPromise : null,
	_addForm(formEl, pageNum) {
		formEl = doc.adoptNode(formEl);
		$hide(formEl = aib.fixHTML(formEl));
		$after(DelForm.last.el, formEl);
		const form = new DelForm(formEl, +pageNum, DelForm.last);
		DelForm.last = form;
		form.addStuff();
		if(pageNum !== aib.page && form.firstThr) {
			formEl.insertAdjacentHTML('afterbegin', `<div class="de-page-num">
				<center style="font-size: 2em">${ Lng.page[lang] } ${ pageNum }</center>
				<hr>
			</div>`);
		}
		$show(formEl);
		return form;
	},
	_endAdding() {
		$del($q('.de-addpage-wait'));
		this._isAdding = false;
		this._addingPromise = null;
	},
	async _updateForms(newForm) {
		readPostsData(newForm.firstThr.op, await readFavorites());
		if(pr.passw) {
			PostForm.setUserPassw();
		}
		embedPostMsgImages(newForm.el);
		if(HotKeys.enabled) {
			HotKeys.clearCPost();
		}
	}
};

function toggleInfinityScroll() {
	if(!aib.t) {
		const evtName = 'onwheel' in doc.defaultView ? 'wheel' : 'mousewheel';
		if(Cfg.inftyScroll) {
			doc.defaultView.addEventListener(evtName, toggleInfinityScroll.onwheel);
		} else {
			doc.defaultView.removeEventListener(evtName, toggleInfinityScroll.onwheel);
		}
	}
}
toggleInfinityScroll.onwheel = e => {
	if((e.type === 'wheel' ? e.deltaY : -('wheelDeltaY' in e ? e.wheelDeltaY : e.wheelDelta)) > 0) {
		window.requestAnimationFrame(() => {
			if(Thread.last.bottom - 150 < Post.sizing.wHeight) {
				Pages.addPage();
			}
		});
	}
};
