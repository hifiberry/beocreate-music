Vue.component('AlbumItem', {
	props: ["album", "inArtist", "stackPosition"],
	template: '<div class="album-item" v-on:click="getAlbum({artist: album.artist, album: album.name, provider: album.provider}, stackPosition)">\
				<div class="artwork-container" v-bind:title="album.name">\
					<img class="square-helper" src="common/square-helper.png">\
					<div class="artwork" v-if="album.img" v-bind:style="{backgroundImage: \'url(\'+album.img+\')\'}"></div>\
					<div class="artwork-placeholder" v-else></div>\
				</div>\
				<div class="album-name">{{ album.name }}</div>\
				<div class="album-artist">{{ !inArtist ? album.artist : (album.date ? album.date.substring(0, 4) : "") }}</div>\
			</div>',
	methods: {
		getAlbum: function(context, stackPosition) {
			music.getContent("album", context, stackPosition);
		}
	}
});

Vue.component('ArtistItem', {
	props: ["artist", "stackPosition"],
	template: '<div class="artist-item" v-on:click="getArtist({artist: artist.artist}, stackPosition)">\
				<div class="artist-img-container" v-bind:title="artist.artist">\
					<img class="square-helper" src="common/square-helper.png">\
					<div class="artist-img" v-if="artist.img" v-bind:style="{backgroundImage: \'url(\'+artist.img+\')\'}"></div>\
					<div class="artist-placeholder" v-else></div>\
				</div>\
				<div class="artist-name">{{ artist.artist }}</div>\
				<div class="artist-albums">{{ artist.albumLength }} album{{(artist.albumLength != 1) ? "s" : ""}}</div>\
			</div>',
	methods: {
		getArtist: function(context, stackPosition) {
			music.getContent("artist", context, stackPosition);
		}
	}
});

Vue.component('MenuItem', {
	props: ["label", "value", "valueLeft", "icon", "hideIcon", "iconRight", "chevron", "description"],
	template: '<div class="menu-item" v-on:click="$emit(\'click\')" v-bind:class="{\'two-rows\': description, icon: icon, \'hide-icon\': hideIcon}">\
					<div class="first-row">\
						<div v-if="icon" class="menu-icon left" v-bind:style="{maskImage: \'url(\'+icon+\')\'}"></div>\
						<div v-if="valueLeft" v-bind:class="{\'with-icon\': icon}" class="menu-value left">{{ valueLeft }}</div>\
						<div class="menu-text-wrap">\
							<div class="menu-label">{{ label }}</div>\
							<div class="menu-value">{{ value }}</div>\
						</div>\
					</div>\
					<div class="menu-custom-markup" v-if="description">\
						<p>{{ description }}</p>\
					</div>\
				</div>'
});

Vue.component('MenuTabs', {
	props: ["tabs", "value"],
	template: '<div class="tabs-container">\
					<div class="tabs">\
						<div v-for="tab in tabs" v-bind:class="{selected: value == tab.name, disabled: tab.disabled}" v-on:click="$emit(\'input\', tab.name)" v-html="tab.title"></div>\
					</div>\
				</div>'
});

var musicVue = new Vue({
	el: "#music-app",
	data: {
		selectedTab: "home",
		tabs: [
			{name: "home", title: "Home"},
			{name: "artists", title: "Artists"},
			{name: "albums", title: "Albums"},
			{name: "songs", title: "Songs", disabled: true}
		],
		currentTrackPath: null,
		artists: [],
		albums: [],
		navStack: [
			{id: 0, type: "placeholder"}
			/*{
				id: 0,
				type: "album",
				name: "Ultraviolet",
				artist: "Poets of the Fall",
				artistImg: "extensions/music/poetsofthefall.jpg",
				img: "extensions/music/ultraviolet.jpg",
				year: 2018,
				text: "Ultraviolet is the eighth studio album from the Helsinki-based Poets of the Fall. Released in 2018, the album retains the band's signature style, whilst mixing in new electronic vibes. Lead singer Marko Saaresto also describes the album as a return to the roots of sorts: \"Back to the roots it is. With the band back to self producing the album, there is a sense of coming home, coming back to the way it was originally meant to be. Also we found this an opportune time to make something more real, if you will, of the Poets of the Fall Morpho sign. Like a new introduction, stating: ”this is the real thing”.\"",
				tracks: [
					{id: 0, name: "Dancing on Broken Glass", length: "3.54"},
					{id: 1, name: "My Dark Disquiet", length: "5.10"},
					{id: 2, name: "False Kings", length: "3.32"},
					{id: 3, name: "Fool's Paradise", length: "4:33"},
					{id: 4, name: "Standstill", length: "3.47"},
					{id: 5, name: "The Sweet Escape", length: "5.30"},
					{id: 6, name: "Moments Before the Storm", length: "4.27", artist: "Old Gods of Asgard"},
					{id: 7, name: "In a Perfect World", length: "4.46"},
					{id: 8, name: "Angel", length: "4.22"},
					{id: 9, name: "Choir of Cicadas", length: "5.04"}
				]
			}*/
		]
	},
	methods: {
		time: function(seconds) {
			return Intl.DateTimeFormat(window.navigator.language, {minute: "numeric", second: "numeric"}).format(new Date(seconds * 1000)).replace(/^0?/g, '');
		},
		releaseDate: function(theTime) {
			if (theTime.length > 4) {
				if (Date.parse(theTime) == Date.parse(theTime.substring(0, 4))) {
					return theTime.substring(0, 4);
				} else {
					return Intl.DateTimeFormat(window.navigator.language, {month: "long", year: "numeric"}).format(new Date(theTime));
				}
			} else if (theTime) {
				return theTime;
			} else {
				return null;
			}
		},
		play: function(index, stackIndex) {
			music.play(index, stackIndex);
		}
	}
});


var music = (function() {

stackPosition = -1;
dataRequested = false;

musicVue.$watch('selectedTab', function(tab) {
	getData = false;
	switch (tab) {
		case "artists":
		case "albums":
			if (musicVue[tab].length == 0) getData = true;
			break;
	}
	if (getData) beo.sendToProduct("music", "getMusic", {type: tab});
});

$(document).on("music", function(event, data) {
	if (data.header == "musicData") {
		if (!data.content.context) {
			if (data.content.type == "albums") {
				musicVue.albums = data.content.data;
			}
			if (data.content.type == "artists") {
				musicVue.artists = data.content.data;
			}
		} else {
			if (dataRequested) {
				data.content.data.id = stackPosition+1;
				musicVue.navStack.splice(stackPosition+1, 2, data.content.data, {id: stackPosition+2, type: "placeholder"});
				beo.showDeepMenu("music-navstack-item-"+(stackPosition+1));
				dataRequested = false;
			}
		}
	}
	
});

$(document).on("general", function(event, data) {
	if (data.header == "activatedExtension") {
		if (data.content.extension == "music") {
			if (data.content.deepMenu != null) {
				stackPosition = parseInt(data.content.deepMenu.split("-").pop());
			} else {
				stackPosition = -1;
			}
		}
	}

});

$(document).on("sources", function(event, data) {
	if (data.header == "sources") {
		
		if (data.content.currentSource &&
			data.content.currentSource == "music") {
			musicVue.currentTrackPath = data.content.sources.music.metadata.uri;
		} else {
			musicVue.currentTrackPath = null;
		}
	}

	
});

function getContent(type, context, stackPosition) {
	dataRequested = true;
	beo.sendToProduct("music", "getMusic", {type: type, context: context});
}

function play(index, stackIndex) {
	beo.sendToProduct("music", "playMusic", {index: index, context: musicVue.navStack[stackIndex].context});
}

return {
	getContent: getContent,
	play: play
};

})();