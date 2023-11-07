import React from 'react';
import './App.css';
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { useState } from 'react';

const fetchSchedule = async () => {
  const url = "https://courses.cs.northwestern.edu/394/data/cs-courses.php";
  const response = await fetch(url);
  if (!response.ok) throw response;
  return addScheduleTimes(await response.json());
};

const meetPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

const timeParts = meets => {

  const [match, days, hh1, mm1, hh2, mm2] = meetPat.exec(meets) || [];

  return !match ? {} : {
    days,
    hours: {
      start: hh1 * 60 + mm1 * 1,
      end: hh2 * 60 + mm2 * 1
    }
  }; 
};

const mapValues = (fn, obj) => {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]));
};

const addCourseTimes = course => {
  return {
    ...course,
    ...timeParts(course.meets),
  };
};

const addScheduleTimes = schedule => {
  return {
    title: schedule.title,
    courses: mapValues(addCourseTimes, schedule.courses)
  };
};

const toggle = (x, lst) => {
  return lst.includes(x) ? lst.filter(y => y !== x) : [x, ...lst];
};

const hasConflict = (course, selected) => {
  return selected.some(selection => courseConflict(course, selection));
};

const days = ['M', 'Tu', 'W', 'Th', 'F'];

const daysOverlap = (days1, days2) => {
  return days.some(day => days1.includes(day) && days2.includes(day));
};

const hoursOverlap = (hours1, hours2) => {
  return Math.max(hours1.start, hours2.start) < Math.min(hours1.end, hours2.end);
};

const timeConflict = (course1, course2) => {
  return daysOverlap(course1.days, course2.days) && hoursOverlap(course1.hours, course2.hours);
};

const courseConflict = (course1, course2) => {
  return getCourseTerm(course1) === getCourseTerm(course2) && timeConflict(course1, course2); 
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
  const [selected, setSelected] = useState([]);  

  return (
    <>
      <TermSelector term={term} setTerm={setTerm} />
        <div className='course-list'>
          { termCourses.map(course => <Course key={course.id} course={course} selected={selected} setSelected={setSelected}/>) }
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

const Course = ({ course, selected, setSelected }) => {
  const isSelected = selected.includes(course);
  const isDisabled = !isSelected && hasConflict(course, selected);
  const style = {
    backgroundColor: isDisabled ? 'lightgrey' : isSelected ? 'lightgreen' : 'white'
  }

  return (
    <div className='card m-1 p-2' style={style} onClick={isDisabled ? null : () => setSelected(toggle(course, selected))}>
    <div className='card-body'>
      <div className='card-title'>{ getCourseTerm(course) } CS { getCourseNumber(course) }</div>
      <div className='card-text'>{ course.title }</div>
      <div className='card-text'>{ course.meets }</div>
    </div>
  </div>
  );
}

const App = () =>  (
  <QueryClientProvider client={queryClient}>
    <Main />
  </QueryClientProvider>
);

export default App;