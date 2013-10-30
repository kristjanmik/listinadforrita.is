/*
 *  Project: Instagram
 *  Description: Instagram feed
 *  Author: Skapalon
 */

;(function ( $, window, document, undefined ) {

	var pluginName = "instagram",
		defaults = {
			endpoint: 'media', // media|tags|locations
			endpoint_option: null, // tag-name|location-id
			clientID: null,
			api_uri: "https://api.instagram.com/v1/",
			limit: 10,
			template: ".template",
			link: true,
			resolution: "standard", // standard|low|thumbnail
			callback: null,
			debug: false
		},
		data = {
			items: {}
		};

	function Plugin( element, options ) {
		this.element = element;
		this.$element = $(element);

		this.options = $.extend( {}, defaults, options );
		this.data = data;

		this._defaults = defaults;
		this._name = pluginName;

		this.initialize();
	}

	Plugin.prototype = {

		initialize: function() {
			if(no_clientID = this.options.clientID === null) console.error('Instagram feed: clientID missing');
			if(no_endpoint = this.options.endpoint === null) console.error('Instagram feed: endpoint missing');
			if(no_endpoint_option = this.options.endpoint !== 'media' && this.options.endpoint_option === null) console.error('Instagram feed: endpoint_option missing');
			if(no_clientID || no_endpoint || no_endpoint_option) return this;

			this.options.api_uri = (this.options.endpoint == 'media' ? this.options.api_uri + "media/popular" : this.options.api_uri + this.options.endpoint + "/" + this.options.endpoint_option + "/media/recent") + "?callback=?";

			this.options.template = this.$element.find(this.options.template);
			this.options.template.remove();

			this.fetchData(this.processData);

			if(this.options.debug) console.dir(this);

			// this.options.callback !== null && typeof this.options.callback == 'function' && this.options.callback();
		},

		fetchData: function ($success) {
			$.ajax({
				type: "GET",
				dataType: "jsonp",
				cache: false,
				url: this.options.api_uri,
				data: {client_id: this.options.clientID, count: (this.options.limit + 10)},
				success: $.proxy($success,this),
				error: $.proxy(function(data){
					if(this.options.debug) {
						console.error('Error fetching data');
						console.dir(data);
					}
				},this)
			});

			setTimeout($.proxy(function(){
				$('img').addClass('hide')
				setTimeout($.proxy(function(){
					this.fetchData(this.processData);
				},this),1000);
			},this),10000);
		},

		processData: function (data) {
			if(this.options.debug) console.dir(data);

			this.data.items = data.data;

			$.when( $.each(this.data.items, $.proxy(this.outputData,this))
				).done(this.options.callback !== null && typeof this.options.callback == 'function' && this.options.callback());
		},

		outputData: function (index, item) {
			if(index+1 > this.options.limit) return;

			var newItem = {
					timestamp: this.timeConverter(item.created_time),
					link: item.link,
					images: item.images
				},
				newElement = this.options.template.clone();

				if(this.options.resolution == "standard") newItem.images = newItem.images.standard_resolution.url;
				if(this.options.resolution == "low") newItem.images = newItem.images.low_resolution.url;
				if(this.options.resolution == "thumbnail") newItem.images = newItem.images.thumbnail.url;

			if(newItem.images) newElement.find('img').attr('src',newItem.images);
			if(newItem.caption) newElement.find('img').attr('title',newItem.caption);
			if(newItem.link) newElement.find('img').wrap('<a href="' + newItem.link + '" />');

			newElement.removeClass('hide template');

			this.$element.prepend(newElement);

			newElement.find('img').on('load',function(e){
				$(this).removeClass('hide')
			})

		},

		timeConverter: function (UNIX_timestamp){
			var a = new Date(UNIX_timestamp*1000);

			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
				year = a.getFullYear(),
				month = a.getMonth(),
				monthname = months[month],
					month = month + 1,
					month = month < 10 ? "0" + month : month,
				date = a.getDate(),
					date = date < 10 ? "0" + date : date,
				hour = a.getHours(),
				min = a.getMinutes(),
				sec = a.getSeconds(),
				// time = date+'.'+month+' '+year+' '+hour+':'+min+':'+sec ;
				time = date+'.'+month+'.'+year ;

			return time;
		}
	};

	$.fn[pluginName] = function ( options ) {
		return this.each(function () {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Plugin( this, options ));
			}
		});
	};

})( jQuery, window, document );
