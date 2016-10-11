//评论项. 评论内容支持markdown
var Comment = React.createClass({
  rawMarkup: function() {
    var md = new Remarkable();
    var rawMarkup = md.render(this.props.children.toString());
    return { __html: rawMarkup };
  },

  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});


//评论项列表
var CommentList = React.createClass({
  render: function() {

    var commentNodes =  this.props.data.map(function(comment) {
      return (
        <Comment author={comment.author} key={comment.id}>
          {comment.text}
        </Comment>
      );
    });

    return (
      <div className="commentList">
      {commentNodes}
      </div>
    );
  }
});

//底部提交评论的表单
var CommentForm = React.createClass({

  //每次渲染时会调用该方法. 使用this.state获取返回的对象
  getInitialState: function() {
    return {author: '', text: ''};
  },
  //自定义的事件处理函数,e参数代表事件对象,e.target代表触发事件的对象
  handleAuthorChange: function(e) {
    //设置state时如果使其值发生了改变会触发render重新渲染
    //设置state时可以只设置部分值
    //如果设置后state值未改变,则不触发render
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    //阻止默认操作
    e.preventDefault();

    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }

    //使用this.props.x来获取传入的参数信息. props时property复数的缩写
    this.props.onCommentSubmit({author: author, text: text});

    this.setState({author: '', text: ''});
  },

  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit} >
        <input 
          type="text" 
          placeholder="Your name" 
          value={this.state.author} 
          onChange={this.handleAuthorChange} 
        />
        <input 
          type="text" 
          placeholder="Say something..." 
          value={this.state.text} 
          onChange={this.handleTextChange} 
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

//整体结构
var CommentBox = React.createClass({

  loadCommentsFromServer: function(){
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data){
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err){
        console.error(this.props.url,status,err.toString());
      }.bind(this)
    });
  },

  getInitialState: function(){
    return {data: []};
  },

  componentDidMount: function(){
    this.loadCommentsFromServer();
    //setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },

  handleCommentSubmit: function(comment) {
    //这里先本地把评论内容显示出来,然后再网络操作
    //网络操作成功则修改state
    //如果失败,则恢复为原来的
    //这么做给用户感觉网络快
    var comments = this.state.data;
    comment.id = Date.now();
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }

});

//virtualDom转realDom并渲染
ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={20000} />,
  document.getElementById('content')
);