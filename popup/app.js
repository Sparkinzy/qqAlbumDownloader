/**
 * @Author:      sparkinzy
 * @DateTime:    2016-12-13 13:59:52
 * @Description: 辅助用户下载相册图片，增加线下管理
 */
$(function(){
	var App = function(){

		var albumList;



		var showClock = function(el){
			var today=new Date();
			var h=today.getHours();
			var m=today.getMinutes();
			var s=today.getSeconds();
			m=m>=10?m:('0'+m);
			s=s>=10?s:('0'+s);
			el.innerHTML = h+":"+m+":"+s;
			setTimeout(function(){ showClock(el);}, 1000);
		};



		var getAlbumList = function(){

			var $albumBox = $('.albums-list');
			var qq = $.trim($('#qq').val());
			if(parseInt(qq) < 10000){
				$('.result').text('请输入正确的QQ号');
				return false;
			}

			$('.result').html('<img src="loading.gif">');
			albumList.clear();
			chrome.tabs.query({ active: true, currentWindow: true },function(tabs){
				chrome.tabs.sendMessage(tabs[0].id,['getAlbum',qq], function(response){
					console.log(response);

					if(response === undefined){
						$('.result').html('页面尚未加载完成<br /><a href="http://i.qq.com/" target="_blank" class="weui_btn weui_btn_warn">登录QQ空间</a>');
						return false;
					}
					var list = response,one = list[0];
					if(one.code){
						$('.result').html(one.msg);
						return false;
					}
					$('.result').html('');
					$.each(list, function(index,li) {
						var desc = '详情数量：'+li.total+' 张';
						if(li.allowAccess){
							desc += '&nbsp;&nbsp;可访问';
						}else{
							desc += '&nbsp;&nbsp;<span style="color:red;">不可访问</span>';
						}
						albumList.add({id:li.id, title:li.title,desc:desc,image:li.index_image});
					});


				});
			});
			
		};
		// 相册列表搜索
		var searchAlbum = function(){
			var options = {
				valueNames:[
					{ data:['id']},
					{ name:'image',attr:'src'},
					'title',
					'desc',
				],
			};
			albumList = new List('albums',options);
		};


		var downloadAblum = function(){
			var that = this, id =  $(that).parents('.album-item').data('id');
			var qq = $.trim($('#qq').val());
			$(that).html('下载中...').addClass('weui_btn_disabled');
			chrome.tabs.query({ active: true, currentWindow: true },function(tabs){
				chrome.tabs.sendMessage(tabs[0].id,['downloadAlbum',id,qq], function(response){
					console.log(response);

					if(response === undefined){
						$('.result').html('页面尚未加载完成');
						return false;
					}
					if(response.complete){
						$(that).attr('disabled',true).addClass('weui_btn_disabled').html('下载成功');
					}else{
						$(that).parents('.album-item').find('.js_progress').css('width',response.progress);
					}

				});
			});

			chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
			    if(message.complete){
			        $('.album-item[data-id='+message.id+']').find('.download-album').attr('disabled',true).addClass('weui_btn_disabled').html('下载成功');
			    }
			    $('.album-item[data-id='+message.id+']').find('.js_progress').css('width',message.progress);
			});
		};

		return {
			init:function(){
				// 显示时间
				showClock($('#clock_div')[0]);
				searchAlbum();
				// 获取相册信息
				$(document).on('click','.getAlbum',getAlbumList);

				// 下载相册
				$(document).on('click','.download-album',downloadAblum);

			}
		};

	}();

	App.init();
});

