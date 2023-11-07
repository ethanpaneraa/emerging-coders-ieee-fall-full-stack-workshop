import React from 'react';
import './App.css';
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { useState } from 'react';

const fetchSchedule = async () => {
  const url = "https://courses.cs.northwestern.edu/394/data/cs-courses.php";
  const response = await fetch(url);
  if (!response.ok) throw response;
  return await response.json();
};

const Banner = ({ title }) => (
  <h1>{ title }</h1>
);

const TermButton = ({ term, checked, setTerm }) => {
  console.log(term)
  return (
    <>
    <input 
      type='radio' 
      id={term} 
      className='btn-check'
      autoComplete='off' 
      checked={checked}
      onChange={() => setTerm(term)}
      />
    <label className='btn btn-success m-1 p-2' htmlFor={term}>
      { term }
    </label>
  </>
  );
};

const TermSelector = ({ term, setTerm }) => {
  console.log(term)
  return (
    <div className='btn-group'>
    {
      Object.values(terms).map(value => 
        <TermButton key={value} term={value} checked={value === term}  setTerm={setTerm}/>)
    }
  </div>
  );
};

const CourseList = ({ courses }) => {
  const [term, setTerm] = useState('Fall');
  const termCourses = Object.values(courses).filter(course => term === getCourseTerm(course)); 

  return (
    <>
      <TermSelector term={term} setTerm={setTerm} />
        <div className='course-list'>
          { termCourses.map(course => <Course key={course.id} course={course} />) }
        </div>
    </>
  );
};

const Main = () =>  {
  const {data, isLoading, error } = useQuery('schedule', fetchSchedule);
  
  if (error) return <h1>{error}</h1>;
  if (isLoading) return <h1>Loading the schedule...</h1>

  return (
    <div className="container">
      <Banner title={ data.title} />
      <CourseList courses={ data.courses } />
    </div>
  );
};

const terms = { F: 'Fall', W: 'Winter', S: 'Spring'};

const getCourseTerm = course => (
  terms[course.id.charAt(0)]
);

const getCourseNumber = course => (
  course.id.slice(1, 4)
);

const queryClient = new QueryClient();

const Course = ({ course }) => (
  <div className='card m-1 p-2'>
    <div className='card-body'>
      <div className='card-title'>{ getCourseTerm(course) } CS { getCourseNumber(course) }</div>
      <div className='card-text'>{ course.title }</div>
      <div className='card-text'>{ course.meets }</div>
    </div>
  </div>
);

const App = () =>  (
  <QueryClientProvider client={queryClient}>
    <Main />
  </QueryClientProvider>
);

export default App;