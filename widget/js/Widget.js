/**
 * @class Widget
 */
var Widget = function () {
	this._selectedKeywordIndex = null;
	this._$keywordContainer = $('._keywordContainer');
	this._$detailContainer = $('._detailContainer');
	this._$wrap = $('#wrap');
	this._templates = {
		tpl_item: $('#tpl_item'),
		tpl_detail_view: $('#tpl_detail_view')
	};

	this._$keywordContainer.on('click', '._keyword', $.proxy(this._onClickKeyword, this));
	this._$wrap.on('click', '._prev', $.proxy(this._onClickPrev, this));
	this._$wrap.on('click', '._next', $.proxy(this._onClickNext, this));

	// 처음 키워드 요청을 함
	this.requestKeyword($.proxy(this._onRequestKeyword, this));
};

Widget.prototype = /** @lends Widget.prototype */{
	URL_KEYWORD : "http://apis.daum.net/socialpick/search?output=json",
	URL_SEARCH : "http://apis.daum.net/search/web?apikey=DAUM_SEARCH_DEMO_APIKEY&output=json",
	CLASSNAME_ITEM_SELECTED : "selected",
	MAX_KEYWORD_COUNT: 5,

	/**
	 * 키워드를 요청
	 * @param {Function} callback
	 * @param {Array} callback.items
	 */
	requestKeyword : function (callback) {
		$.ajax({
			url: this.URL_KEYWORD,
			dataType: 'jsonp',
			success: function (data) {
				callback(data && data.socialpick ? data.socialpick.item : []);
			}
		});
	},

	_onRequestKeyword: function (items) {
		var output = '';

		for (var i = 0, l = Math.min(this.MAX_KEYWORD_COUNT, items.length); i < l; i++) {
			output += this._makeKeyword(items[i], i);
		}

		this._$keywordContainer.html(output);
		
		// 첫 번째 키워드를 선택된 상태로 만듦
		this.selectKeyword(0);
	},

	_makeKeyword: function (item, index) {
		// category: "c"
		// comment_cnt: "2758"
		// content: "2014년 06월 17일, 이데일리에서 온 글입니다"
		// count: "87547"
		// keyword: "제국의 위안부 고소"
		// link: "http://search.daum.net/search?q=%EC%A0%9C%EA%B5%AD%EC%9D%98%20%EC%9C%84%EC%95%88%EB%B6%80%20%EA%B3%A0%EC%86%8C&DA=DLVC&rtmaxcoll=DQP"
		// quotation_cnt: "443"
		// rank: "5"
		// rank_diff: "0"
		return this._getTemplate('tpl_item', {
			keyword: item.keyword,
			index: index
		});
	},

	requestSearch: function (query, callback) {
		$.ajax({
			url: this.URL_SEARCH,
			data: {
				q: query
			},
			dataType: 'jsonp',
			success: function (data) {
				callback(data && data.channel && data.channel.item ? data.channel.item[0] : null);
			}
		});
	},

	/**
	 * 해당 순서의 키워드를 선택
	 * @param {Number} index 0~
	 */
	selectKeyword: function (index) {
		var $keyword;

		if (this._selectedKeywordIndex !== null) {
			this._getKeywordElement(this._selectedKeywordIndex).removeClass(this.CLASSNAME_ITEM_SELECTED);
		}
		
		$keyword = this._getKeywordElement(index).addClass(this.CLASSNAME_ITEM_SELECTED);
		this._selectedKeywordIndex = index;

		this.requestSearch($keyword.text(), $.proxy(this._onRequestSearch, this));
	},

	/**
	 * 이전 키워드로 옮김
	 */
	nextKeyword: function () {
		var currentIndex = this._selectedKeywordIndex;
		currentIndex++;

		if (currentIndex >= this.MAX_KEYWORD_COUNT) {
			currentIndex = 0;
		}
		
		this.selectKeyword(currentIndex);
	},

	/**
	 * 다음 키워드로 옮김
	 */
	prevKeyword: function () {
		var currentIndex = this._selectedKeywordIndex;
		currentIndex--;

		if (currentIndex < 0) {
			currentIndex = this.MAX_KEYWORD_COUNT - 1;
		}

		this.selectKeyword(currentIndex);
	},

	_getKeywordElement: function (index) {
		return this._$keywordContainer.find(':eq(' + index + ')');
	},

	_getTemplate: function (id, values) {
		return this._templates[id].text().replace(/{{([^}]+)}}/g, function (text, matchedText) {
			return values && typeof values[matchedText] !== 'undefined' ? values[matchedText] : '';
		});
	},

	_onClickKeyword: function (e) {
		e.preventDefault();

		var index = parseInt($(e.currentTarget).attr('data-index'), 10);
		this.selectKeyword(index);
	},

	_onClickPrev: function (e) {
		e.preventDefault();
		this.prevKeyword();
	},

	_onClickNext: function (e) {
		e.preventDefault();
		this.nextKeyword();
	},

	_onRequestSearch: function (data) {
		// description: "&lt;b&gt;기사&lt;/b&gt; 나도한마디 2014-06-17 12:42 검찰이  돈가방 논란 을 빚고있는 &lt;b&gt;박상은&lt;/b&gt; 새누리당 의원의 &lt;b&gt;운전기사&lt;/b&gt;를 최근 참고인 신분으로 불러 조사했습니다. 인천지방검찰청 해운비리 특별수사팀은 검찰에 돈가방을 제출한 &lt;b&gt;운전기사&lt;/b&gt;를..."
		// link: "http://health.ytn.co.kr/_ln/0103_201406171242370433"
		// pubDate: "2014-06-17 11:17:02"
		// title: "검찰, &lt;b&gt;박상은&lt;/b&gt;  돈가방  넘긴 &lt;b&gt;운전기사&lt;/b&gt; 조사"
		// url: "health.ytn.co.kr"
		
		// 하이라이팅된 검색어 태그가 escape된 상태로 넘어오기 때문에 해당 태그를 풀어준다
		data.description = this._unescapeHtmlString(data.description);
		data.title = this._unescapeHtmlString(data.title);

		// 상세보기 컨테이너에 마크업 할당
		this._$detailContainer.html(this._getTemplate('tpl_detail_view', data));
	},

	_unescapeHtmlString: function (str) {
		return str.toString().replace(/&lt;b&gt;/g, '<b>')
									.replace(/&lt;\/b&gt;/g, '</b>');
	}
};