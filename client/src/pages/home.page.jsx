
import React, { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InPageNavigaion, { activeTabRef } from "../components/inpage-navigation.component";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimulBlogPost from "../components/nobanner-blog-post.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";
import "./home.page.css";

const Home = () => {
  let [blogs, setBlogs] = useState(null);
  let [trendingBlogs, setTrendingBlogs] = useState(null);
  let [pageState, setPageState] = useState('home')
  let categories = [
    "programming",
    "hollywood",
    "food",
    "future",
    "cooking",
    "tech",
    "travel",
  ];
  const fetchLatestBlogs = ({page = 1}) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blog", {page})
      .then( async ({ data }) => {
        let formateData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute: '/all-latest-blogs-count'
        })
        setBlogs(formateData)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchTrendingBlogs = () => {
    axios
      .get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blog")
      .then(({ data }) => {
        setTrendingBlogs(data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchBlogByCategory = ({page = 1}) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {tag: pageState, page})
      .then( async({ data }) => {
        let formateData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute: '/all-search-blogs-count',
          data_to_send: {tag: pageState}
        })
        setBlogs(formateData)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const loadBlogbyCategory = (e) =>{
    let category = e.target.innerText.toLowerCase();
    setBlogs(null)

    if(pageState === category){
        setPageState('home');
        return;
    }
    setPageState(category)
  }
  useEffect(() => {
    activeTabRef.current.click()
    if(pageState === 'home')
        fetchLatestBlogs({page: 1});
    else{
        fetchBlogByCategory({page: 1})
    }
    if(!trendingBlogs)
        fetchTrendingBlogs();
  }, [pageState]);
  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        <div className="w-full flex flex-col items-center justify-center">


          <img className="img" src="https://indiacsr.in/wp-content/uploads/2023/06/Blogging-Future-in-India.jpg"
          alt=""/>



          {/*<h1 className="text-4xl font-bold mb-8">EPIC BLOG... </h1>*/}
          
          {/* latest blog */}
          <div className="w-full">
            <InPageNavigaion
              routes={[pageState]}
            >
              <>
                {blogs === null ? (
                  <Loader />
                ) : (
                  !blogs.results.length ? <NoDataMessage message={'No blog published'}/> : 
                  blogs.results.map((blog, i) => {
                      return (
                        <AnimationWrapper
                          key={i}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        >
                          <BlogPostCard
                            content={blog}
                            author={blog.author.personal_info}
                          />
                        </AnimationWrapper>
                      );
                    })
                )}
                <LoadMoreDataBtn state={blogs} fetchDataFun={(pageState === 'home' ? fetchLatestBlogs : fetchBlogByCategory )}/>
              </>
            </InPageNavigaion>
          </div>
        </div>
        {/* trending section */}
        <div className="min-w-[30%] lg:min-w-[400px] border-l border-grey pl-8 pt-3 max-md:hidden custom-background-color">
          <h1 className="text-2xl font-bold mb-4">Trending</h1>
          {trendingBlogs === null ? (
            <Loader />
          ) : (
            trendingBlogs.length ? 
            trendingBlogs.map((blog, i) => {
              return (
                <AnimationWrapper
                  key={i}
                  transition={{ duration: 1, delay: i * 0.1 }}
                >
                  <MinimulBlogPost blog={blog} index={i} />
                </AnimationWrapper>
              )
            })
            : <NoDataMessage message={'No blog Trending'}/> 
          )}
        </div>
      </section>

      <style>{`
        /* Add your CSS styles here */
        .h-cover {
          padding: 20px;
          background-color: #F5F5F5;
        }

        .border-grey {
          border-color: #ccc;
        }

        .custom-background-color {
          background-color: #C0C0C0; /* You can replace #f0f0f0 with your desired background color */
        }
        
      `}</style>
    </AnimationWrapper>
  );
};

export default Home;