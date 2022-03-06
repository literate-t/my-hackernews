type Store = {
  currentPage: number;
  feeds: NewsFeed[];
}

type NewsFeed = {
  id: number;
  comments_count: number;
  url: string;
  user: string;
  time_ago: string;
  points: number;
  title: string;
  read?: boolean; // optional
}

const container: HTMLElement | null  = document.getElementById("root");
const ajax: XMLHttpRequest = new XMLHttpRequest();
const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";
const content = document.createElement("div");
const ul = document.createElement("ul");

const SHOW_LIST = 10;

const store: Store = {
  currentPage: 1,
  feeds: [],
};

const makeFeeds = (feeds) => {
  // i는 타입 추론 됐음
  for (let i = 0; i < feeds.length; ++i) {
    feeds[i].read = false;
  }
  return feeds;
};

function updateView(html) {
  if(container) {
    container.innerHTML = html;
  } else {
    console.error('null container');
  }
}

function newsFeed() {
  let newsFeed: NewsFeed[] = store.feeds;

  if (0 === newsFeed.length) {
    newsFeed = store.feeds = makeFeeds(getData(NEWS_URL));
  }

  const newFeedLength = newsFeed.length;
  const maximumPage = Math.ceil(newFeedLength / SHOW_LIST);
  const newsList = [];

  let template = `
        <div class="bg-gray-600 min-h-screen">
          <div class="bg-white text-xl">
            <div class="mx-auto px-4">
              <div class="flex justify-between items-center py-6">
                <div class="flex justify-start">
                  <h1 class="font-extrabold">Hacker News</h1>
                </div>
                <div class="items-center justify-end">  
                  <a href="#/page/{{__prev_page__}}" class="text-gray-500">
                    Previous
                  </a>
                  <a href="#/page/{{__next_page__}}" class="text-gray-500 ml-4">
                    Next
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 text-2xl text-gray-700">
            {{__news_feed__}}
          </div>
        </div>
    `;

  //newsList.push("<ul>");
  let current = store.currentPage * SHOW_LIST;
  if (current >= newFeedLength) {
    current = newFeedLength;
  }
  for (let i = (store.currentPage - 1) * SHOW_LIST; i < current; ++i) {
    newsList.push(`
      <div class="p-6 ${
        newsFeed[i].read ? "bg-red-500" : "bg-white"
      } mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
        <div class="flex">
          <div class="flex-auto">
            <a href="#/show/${newsFeed[i].id}">${newsFeed[i].title}</a>
          </div>
          <div class="text-center text-sm">
            <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${
              newsFeed[i].comments_count
            }</div>
          </div>
        </div>
        <div class="flex mt-3">
          <div class="grid grid-cols-3 text-sm text-gray-500">
            <div><i class="fas fa-user mr-l"></i>${newsFeed[i].user}</div>
            <div><i class="fas fa-heart mr-l"></i>${newsFeed[i].points}</div>
            <div><i class="fas fa-clock mr-l"></i>${newsFeed[i].time_ago}</div>
          </div>
        </div>
      </div>
    `);
  }
  template = template.replace("{{__news_feed__}}", newsList.join(""));
  template = template.replace(
    "{{__prev_page__}}",
    store.currentPage > 1 ? store.currentPage - 1 : 1
  );
  template = template.replace(
    "{{__next_page__}}",
    store.currentPage < maximumPage ? store.currentPage + 1 : maximumPage
  );

  updateView(template);
}

function newsDetail() {
  const id = location.hash.substring(7);
  const contentUrl = CONTENT_URL.replace("@id", id);

  const newsContent = getData(contentUrl);
  const title = document.createElement("h1");
  let template = `
    <div class="bg-gray-600 min-h-screen pb-8">
     <div class="bg-white text-xl">
      <div class="mx-auto px-4">
        <div class="flex justify-between items-center py-6">
          <div class="flex justify-start">
            <h1 class="font-extrabold">Hacker News</h1>
          </div>
          <div class="items-center justify-end">
            <a href="#/page/${store.currentPage}" class="text-gray-500"> 
              <i class="fa fa-times"></i>
            </a>
          </div>
        </div>
      </div>
     </div>

     <div class="h-full border rounded-xl bg-white m-6 p-4">
      <h2>${newsContent.title}</h2>
      <div class="text-gray-400 h-20">
        ${newsContent.content}
      </div>
        {{__comments__}}
     </div>
    </div>
  `;

  for (let i = 0; i < store.feeds.length; ++i) {
    if (store.feeds[i].id === Number(id)) {
      store.feeds[i].read = true;
      break;
    }
  }

  function makeComment(comments, called = 0) {
    const commentString = [];

    for (let i = 0; i < comments.length; ++i) {
      commentString.push(`
        <div style="padding-left:${called * 40}px;" class="mt-4">
          <div class="text-gray-400">
            <i class="fa fa-sort-up mr-2"></i>
            <strong>${comments[i].user}</strong> ${comments[i].time_ago}
          </div>
          <p class="text-gray-700">${comments[i].content}</p>
        </div>
      `);
      if (comments[i].comments.length > 0) {
        commentString.push(makeComment(comments[i].comments, called + 1));
      }
    }
    return commentString.join("");
  }
  
  updateView(template.replace("{{__comments__}}", makeComment(newsContent.comments)));  
}

function getData(url) {
  ajax.open("GET", url, false);
  ajax.send();

  return JSON.parse(ajax.response);
}

function router() {
  const routePath = location.hash;
  if (routePath === "") {
    newsFeed();
  } else if (routePath.indexOf("#/page/") >= 0) {
    store.currentPage = Number(routePath.substring(7));
    newsFeed();
  } else {
    newsDetail();
  }
}

//window.addEventListener("hashchange", newsDetail);
window.addEventListener("hashchange", router);

router();
