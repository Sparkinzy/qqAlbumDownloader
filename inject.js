/**
 * @Author:      sparkinzy
 * @DateTime:    2016-12-13 13:59:07
 * @Description: 辅助用户下载相册图片，增加线下管理
 */
var  juyuan_Callback = function(data)
{
	return data;
};

// $(function(){

// var j_tk = QZONE.FrontPage.getACSRFToken();
	console.log('downloader start');

	var uin = $.cookie('uin');
	uin = uin.replace('o','');
	console.log(uin);
	
	var Inject = function(){

		var getACSRFToken =function() {
		    url = window.location.href;
		    var skey;
		    if (url) {
		      if (url.host && url.host.indexOf("qzone.qq.com") > 0) {
		        try {
		          skey = $.cookie("p_skey");
		        } catch (err) {
		          skey = $.cookie("p_skey");
		        }
		      } else {
		        if (url.host && url.host.indexOf("qq.com") > 0) {
		          skey = $.cookie("skey");
		        }
		      }
		    }
		    if (!skey) {
		      skey = $.cookie("p_skey") || ($.cookie("skey") || ($.cookie("rv2") || ""));
		    }
		    var hash = 5381;
		    for (var i = 0, len = skey.length;i < len;++i) {
		      hash += (hash << 5) + skey.charCodeAt(i);
		    }
		    return hash & 2147483647;
		  };
		// 通过接口获取数据
		var getAlbumsVisaUrl = function(qq,classId){
			console.log('get album here');
			var param = {};

			param.g_tk             = getACSRFToken();
			param.t                = + new Date();
			param.hostUin          = qq;
			param.uin              = uin;
			param.appid            = 4;
			param.inCharset        = 'utf-8';
			param.outCharset       = 'utf-8';
			param.source           = 'qzone';
			param.plat             = 'qzone';
			param.format           = 'jsonp';
			param.notice           = 0;
			param.filter           = 1;
			param.handset          = 4;
			param.pageNumModeSort  = 40;
			param.pageNumModeClass = 15;
			param.needUserInfo     = 1;
			param.idcNum           = 0;
			param.mode             = 4;
			param.sortOrder        = 2;
			param.pageStart        = 0;
			param.pageNum          = 500;
			param.classId          = classId;
			param.callbackFun      = 'juyuan';

			// var qq = '815537265';

			var url='https://h5.qzone.qq.com/proxy/domain/shalist.photo.qq.com/fcgi-bin/fcg_list_album_v3?'+$.param(param);
			console.log('visa here');

			

			var result = $.ajax({
				url:url,
				async:false,
				type:'GET',
				cache:false,
			}).responseText;
			// console.log('get data'); 
			var rs = eval(result);
			var albums = [];
			// console.log(rs);
			if(rs.code === 0){
				if(rs.data.albumsInUser === 0) return [];
				$.each(rs.data.albumList, function(index, album) {
					albums.push({
						index_image:album.pre,
						title:album.name,
						id:album.id,
						total:album.total,
						allowAccess:album.allowAccess
					});
				});
			}else{
				albums.push({
					code:rs.code,
					msg : rs.message
				});
			}
			console.log(albums);
			return albums;

		};
		// 获取相册里的图片列表
		var getPhotoList = function(albumId,qq){
			var param = {};

			param.g_tk         = getACSRFToken();
			param.t            = + new Date();
			param.mode         = 0;
			param.idcNum       = 0;
			param.hostUin      = qq;
			param.topicId      = albumId;
			param.noTopic      = 0;
			param.uin          = uin;
			param.pageStart    = 0;
			param.pageNum      = 500;
			param.skipCmtCount = 0;
			param.singleurl    = 1;
			param.batchId      = '';
			param.notice       = 0;
			param.appid        = 4;
			param.inCharset    = 'utf-8';
			param.outCharset   = 'utf-8';
			param.source       = 'qzone';
			param.plat         = 'qzone';
			param.outstyle     = 'json';
			param.format       = 'jsonp';
			param.json_esc     = 1;
			param.question     = '';
			param.answer       = '';
			param.callback     = 'callback';
			param.callbackFun  = 'juyuan';


			var url = 'https://h5.qzone.qq.com/proxy/domain/shalist.photo.qq.com/fcgi-bin/cgi_list_photo?'+$.param(param);

			var result = $.ajax({
				url:url,
				async:false,
				type:'GET',
				cache:false,
			}).responseText;

			var rs = eval(result);
			var list = [];
			var album_name;
			if(rs.code === 0){
				album_name = rs.data.topic.name;
				$.each(rs.data.photoList, function(index, photo) {
					list.push({
						widht: photo.width,
						height:photo.height,
						url:photo.url,
						name:photo.name
					});
				});



			}
			console.log(list);
			return {
				album_name:album_name,
				list:list
			};
		};


		var loadImageData = function(photos,index,zip,imgDir,album_name,albumId)
		{

			var img = new Image();
			img.crossOrigin = 'anonymous';

			var result = {
				id:albumId,
				complete:0,
				progress:0
			};

			img.onload = function () {

				var canvas = document.createElement('canvas');
				var context = canvas.getContext('2d');

				canvas.height = img.height;
				canvas.width = img.width;

				context.drawImage(img, 0, 0);

				var dataURL = canvas.toDataURL();
				// console.log(dataURL);
				var tmp = dataURL.split(',');
				var time = + new Date();
				time+='';
				// console.log(tmp[0]);
				imgDir.file(photos[index].name+'_'+time.substr(10)+'.jpg',tmp[1],{ base64:true,binary:true});
				++index;
				if(index >= photos.length){

					result.complete = 1;
					result.progress = '100%';

					$('body #progress-'+albumId).find('.progress-bar').text(result.progress).css('width',result.progress);
					
					chrome.runtime.sendMessage(result);

					zip.generateAsync({type:"blob"})
					.then(function(content) {
					    // see FileSaver.js
					    saveAs(content, album_name+".zip");
					});
					return false;
				}
				result.progress = ((index/photos.length)*100).toFixed(2)+'%';
				console.log(result);
				$('body #progress-'+albumId).find('.progress-bar').text(result.progress).css('width',result.progress);
				chrome.runtime.sendMessage(result);

				loadImageData(photos,index,zip,imgDir,album_name,albumId);
			 	
			};

			img.src=photos[index].url;
			// console.log(img.src);

		};




		return {
			init:function(){

				// getAlbumsVisaUrl();
				chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
					console.log(message);
					switch(message[0]){
						case 'getAlbum':
							var albums = getAlbumsVisaUrl(message[1],100); // 最爱
							var fj_albums = getAlbumsVisaUrl(message[1],102); // 风景
							var dw_albums = getAlbumsVisaUrl(message[1],103); // 动物
							var yj_albums = getAlbumsVisaUrl(message[1],104); // 游记
							var kt_albums = getAlbumsVisaUrl(message[1],105); // 卡通
							var sh_albums = getAlbumsVisaUrl(message[1],106); // 生活
							var qt_albums = getAlbumsVisaUrl(message[1],107); // 其他
							var rw_albums = getAlbumsVisaUrl(message[1],101); // 人物
							albums = albums.concat(fj_albums,dw_albums,yj_albums,kt_albums,sh_albums,qt_albums,rw_albums);

							sendResponse(albums);
						break;
						case 'downloadAlbum':
							var albumId = message[1], qq = message[2];
							// downloadAlbum(albumId,qq);
							var rs = getPhotoList(albumId,qq),
							album_name = rs.album_name,
							photoList = rs.list;

							toastr.options = {
							  "closeButton": false,
							  "debug": false,
							  "positionClass": "toast-bottom-full-width",
							  "onclick": null,
							  "showDuration": "300",
							  "hideDuration": "1000",
							  "timeOut": "0",
							  "extendedTimeOut": "1000",
							  "showEasing": "swing",
							  "hideEasing": "linear",
							  "showMethod": "fadeIn",
							  "hideMethod": "fadeOut"
							};

							var msg = '<div>'+album_name+'下载中...</div>';
							msg += '<div class="progress" id="progress-'+albumId+'">'+
							'  <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 0%">'+
							'0%'+
							'  </div>'+
							'</div>';
							toastr.info(msg);


							// console.log(rs);
							var result = {
								complete:0,
								progress:0
							};
							sendResponse(result);
							// 组装zip包
							var zip = new JSZip();
							var img = zip.folder(album_name);
							if(photoList.length){
								loadImageData(photoList,0,zip,img,album_name,albumId);
							}

							console.log('downloadAlbum');
						break;
					}
				});
			}
		};
	}();

	Inject.init();
// });