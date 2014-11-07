function redirect(ts){
    window.location.href = '/index/zhibiao?query=' + QUERY + '&during=' + ts;
}

Date.prototype.format = function(format) { 
    var o = { 
        "M+" : this.getMonth()+1, //month 
        "d+" : this.getDate(),    //day 
        "h+" : this.getHours(),   //hour 
        "m+" : this.getMinutes(), //minute 
        "s+" : this.getSeconds(), //second 
        "q+" : Math.floor((this.getMonth()+3)/3),  //quarter 
        "S" : this.getMilliseconds() //millisecond 
    } 
    if(/(y+)/.test(format)) 
    format=format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
    for(var k in o)
    if(new RegExp("("+ k +")").test(format)) 
        format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
    return format; 
}

function TrendsLine(query, start_ts, end_ts, pointInterval){
    //instance property
    this.query = query;
    this.start_ts = start_ts; // 开始时间戳
    this.end_ts = end_ts; // 终止时间戳
    this.pointInterval = pointInterval; // 图上一点的时间间隔
    this.during = end_ts - start_ts; // 整个时间范围
    this.pie_ajax_url = function(query, end_ts, during){
        return "/guming/stock_pie_count/?&query=" + query + "&during=" + during  + "&ts=" + end_ts;
    }
    this.weibos_ajax_url = function(query, end_ts, during, from, size){
        return "/guming/sentiment_post/?query=" + query + "&during=" + during + "&from=" + from + "&size=" + size + "&ts=" + end_ts;
    }
    this.ajax_method = "GET";
    this.call_sync_ajax_request = function(url, method, callback){
        $.ajax({
            url: url,
            type: method,
            dataType: "json",
            async: false,
            success: callback
        })
    }
    this.call_async_ajax_request = function(url, method, callback){
        $.ajax({
            url: url,
            type: method,
            dataType: "json",
            async: true,
            success: callback
        })
    }
    this.range_count_data = {};
    this.range_keywords_data = {};
    this.range_weibos_data = {};
    this.top_keywords_limit = 50; // 和计算相关的50，实际返回10
    this.one_page_info_limit = 5; // 加载一次的信息条数
    this.top_weibos_limit = 100; // 返回100条重要帖子
    this.max_keywords_size = 50;
    this.min_keywords_size = 2;
    this.pie_title = '情绪饼图';
    this.pie_series_title = '情绪占比';
    this.pie_div_id = 'pie_div';
    this.trend_div_id = 'trend_div';
    this.trend_title = '情绪走势图';
    this.trend_chart;

    this.names = {
        'positive': '积极',
        'negative': '消极'
    }

    this.trend_count_obj = {
        'ts': [], // 时间数组
        'count': {},
        'ratio': {}
    };

    for (var name in this.names){
        this.trend_count_obj['count'][name] = [];
        this.trend_count_obj['ratio'][name] = [];
    }

    this.post_offset = 0;
    this.pie_offset = 0;
}


TrendsLine.prototype.initPullDrawPie = function(){
    var ajax_url = this.pie_ajax_url(this.query, this.end_ts, this.during);
    var that = this;
    this.call_async_ajax_request(ajax_url, this.ajax_method, pie_callback);

    function pie_callback(data){
        var value = [];
        var percentage = [];
        var stock_name = [];
        var negative_percent = [];
        var total = 0;
        
        for (var i = 0; i < data.length ;i++) {
            stock_name.push(data[i][0]);
            value.push(data[i][1]);
            total += data[i][1];
            negative_percent.push((data[i][2] * 1.0 / data[i][1]).toFixed(2));
        }
    
        for (var i = 0; i < stock_name.length ;i++) {
            percentage.push((value[i] * 1.0 / total).toFixed(2));
        }
  
        draw_pie(percentage, stock_name);
        draw_index(stock_name, negative_percent, that.pie_offset);

        $("#click_before").click(function(){
            that.pie_offset -= 1;
            draw_index(stock_name, negative_percent, that.pie_offset);
        });

        $("#click_next").click(function(){
            that.pie_offset += 1;
            draw_index(stock_name, negative_percent, that.pie_offset);
        });    
    }
}

function draw_pie(percentage, stock_name){
    var pie_data=[];
        pie_data = [{value:  percentage[0], name:stock_name[0]},{value:  percentage[1], name:stock_name[1]},
                    {value:  percentage[2], name:stock_name[2]},{value:  percentage[3], name:stock_name[3]},
                    {value:  percentage[4], name:stock_name[4]},{value:  percentage[5], name:stock_name[5]},
                    {value:  percentage[6], name:stock_name[6]},{value:  percentage[7], name:stock_name[7]},
                    {value:  percentage[8], name:stock_name[8]},{value:  percentage[9], name:stock_name[9]}];

    option = {
        title : {
            text: '',
            x:'center',
            textStyle:{
            fontWeight:'lighter',
            fontSize: 14,
            }        
        },
        
        tooltip : {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },

        calculable : true,
        series : [{
            name:'',
            type:'pie',
            radius : '45%',
            center: ['50%', '50%'],
            data:pie_data
        }]
    };

    var myChart = echarts.init(document.getElementById('pie'));
    myChart.setOption(option);
}

function draw_index(stock_name, negative_percent, pie_idx){
    var data_length = stock_name.length;

    if(pie_idx == 0){
        document.getElementById("click_before").disabled = true;
    }
    else if(pie_idx * 2 == data_length - 2){
        document.getElementById("click_next").disabled = true;
    }
    else{
        document.getElementById("click_before").disabled = false;
        document.getElementById("click_next").disabled = false;
    }

    var labelTop = {
        normal : {
            label : {
                show : true,
                position : 'center',
                textStyle: {
                    baseline : 'bottom'
                }
            },
            labelLine : {
                show : false
            }
        }
    };
    var labelBottom = {
        normal : {
            color: '#ccc',
            label : {
                show : true,
                position : 'center',
                formatter : function (a,b,c){return 100 - c + '%'},
                textStyle: {
                    baseline : 'top'
                }
            },
            labelLine : {
                show : false
            }
        },
        emphasis: {
            color: 'rgba(0,0,0,0)'
        }
    };
    var radius = [45, 60];
    var option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}%"
        },
        title : {
            text: '',
            x:'center',
            textStyle:{
            fontWeight:'lighter',
            fontSize: 14,
            }        
        },
        series : [
            {
                name:stock_name[0],
                type:'gauge',
                center : ['35%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[2 * pie_idx] * 100, name: stock_name[2 * pie_idx]}]
            },
            {
                name:stock_name[1],
                type:'gauge',
                center : ['70%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[2 * pie_idx + 1] * 100, name: stock_name[2 * pie_idx + 1]}]
            }
        ]
    };
    
    var myChart = echarts.init(document.getElementById('index'));
    myChart.setOption(option);
}

TrendsLine.prototype.initPullDrawWeibos = function(){
    var names = this.names;
    var weibos_data = [];
    that = this;
    var ajax_url = this.weibos_ajax_url(this.query, this.end_ts, this.during, 0, this.one_page_info_limit);
    this.call_async_ajax_request(ajax_url, this.ajax_method, range_weibos_callback);

    function range_weibos_callback(data){
        var info_list = [];
        for(var name in data){
            for(var i in data[name]){
                info_list.push(data[name][i]);
            }
        }

        var html = "";
        data = info_list;
        var length = data.length;
        for(var i = 0; i < length; i += 1){
            var da = data[i];
            var sentiment = da['sentiment'];
            if(sentiment == 1){
                sentiment = '积极';
            }
            else{
                sentiment = '消极';
            }
            var uid = da['_id'];
            var name = da['user_name'];
            var title = da['title'];
            var text = da['content'];
            var clicks_count = da['clicks'];
            var reply_count = da['replies'];
            var lastreply_time = da['lastReplyTime'];
            var releasetime = da['releaseTime'];
            var weibo_link = da['url'];
            var user_link = da['user_url'];
            var user_image_link = '/static/img/unknown_profile_image.gif';
            html += '<li class="item"><div class="weibo_face"><a target="_blank" href="' + user_link + '">';
            html += '<img src="' + user_image_link + '">';
            html += '</a></div>';
            html += '<div class="weibo_detail">';
            html += '<p><h4>昵称:<a class="undlin" target="_blank" href="' + user_link  + '">' + name + '</a>&nbsp;&nbsp;发布&nbsp;&nbsp;【' + title + '】：' + text + '（' + sentiment + '）</h4></p>';
            html += '<div class="weibo_info">';
            html += '<div class="weibo_pz">';
            html += '<h5>';
            html += '<a class="undlin" href="javascript:;" target="_blank">点击数(' + clicks_count + ')</a>&nbsp;&nbsp;|&nbsp;&nbsp;';
            html += '<a class="undlin" href="javascript:;" target="_blank">回复数(' + reply_count+ ')</a></div>';
            html += '<div class="m">';
             html += '</h5>';
            html += '<h5>';
            html += '<a class="undlin" target="_blank" href="' + weibo_link + '">发表时间' + releasetime + '</a>-';
            html += '<a target="_blank" href="' + weibo_link + '">帖子页面</a>-';
            html += '<a target="_blank" href="' + user_link + '">用户页面</a>';
             html += '</h5>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</li>';
        }

        $("#weibo_ul").append(html);
        $("#content_control_height").css("height", $("#weibo_ul").css("height"));

        that.post_offset += that.one_page_info_limit;
        $("#more_information").click(function(){
            var ajax_url = that.weibos_ajax_url(that.query, that.end_ts, that.during, that.post_offset, that.one_page_info_limit);
            that.call_async_ajax_request(ajax_url, that.ajax_method, range_weibos_callback);
        });
    }
}

var query = QUERY;
var during = DURING;
var ts = END_TS;
tl = new TrendsLine(query, ts - during, ts, during);
tl.initPullDrawPie();
tl.initPullDrawWeibos();