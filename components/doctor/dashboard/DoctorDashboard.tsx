"use client";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks/hooks";
import {
  addSpecialization,
  removeSpecialization,
  setDob,
  setSpecializations,
} from "@/Redux/reducers/UserReducers";
import {
  UpdateProfileImage,
  updateDoctorProfile,
  updateUser,
} from "@/ServerActions";
import { DatePickerDemo } from "@/components/DatePicker";

import TagInput from "@/components/Input/TagsInput";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

type DoctorProfile = {
  specializations: string[];
  schedules: {
    day: string;
    startTime: string;
    endTime: string;
  }[];

  educations: {
    university: string;
    degree: string;
    duration: string;
  }[];
  workExperiences: {
    clinic: string;
    duration: string;
  }[];
  awards: {
    date: string;
    title: string;
    description: string;
  }[];
  id: string;
  userId: string;
  fee: number;
  experience: number;
  description: string;
  profilePic: string;
  status: string;

  mode:string
isAvailableForDesk:boolean
  user: {
    id: string;
    username: string;
    Fname: string;
    Lname: string;
    email: string;
    age: number;
    gender: string;
    dob: string;

    bloodGroup: string;
    contact: string;
    role: string;
    userId: string;

    address: {
      address: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    };
  };
};

const DoctorDashboard = ({ datas }: { datas: DoctorProfile }) => {
  const [services, setServices] = useState<string[]>([]);

  const session = useSession();
  const [data, setData] = useState<DoctorProfile>();

  const [refrsh, setRefresh] = useState(false);
  const specialization = useAppSelector(
    (state) => state.userReducer.specializatins
  );
  const dispatch = useAppDispatch();
  const dobDate = useAppSelector((state) => state.userReducer.dob);

  const dob = useAppSelector((state) => state.userReducer.dob);

  // const [specialization,setSpecialization] = useState<string[]>([]);

  useEffect(() => {
    if (datas) {
      dispatch(setSpecializations(datas.specializations));
      setData(datas);
      if (datas.user.dob)
        dispatch(setDob(new Date(datas?.user?.dob).toString()));

      console.log(datas);
    }
  }, []);

  const {
    register,
    formState: { errors },
    getValues,
    setError,
    clearErrors,
    control,
    handleSubmit,
  } = useForm({
    defaultValues: datas,
  });

  const handleOnSetServices = (service: string) => {
    setServices([...services, service]);
  };

  const [file, setFile] = React.useState<File | null>(null);

  const handleOnSetSpecialization = (val: string) => {
    dispatch(addSpecialization(val));
  };

  const handleOnRemoveServices = (index: number) => {
    setServices(services.filter((val, i) => i !== index));
  };

  const handleOnRemoveSpecialization = (index: number) => {
    removeSpecialization(index);
  };

  const {
    fields: educationArr,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    name: "educations",
    control,
  });

  const {
    fields: awardsArr,
    append: appendAwards,
    remove: removeAwards,
  } = useFieldArray({
    name: "awards",
    control,
  });

  const {
    fields: experienceArr,
    append: appendexperience,
    remove: removeexperience,
  } = useFieldArray({
    name: "workExperiences",
    control,
  });

  const submit = async (dt: DoctorProfile) => {
    if (!session.data) {
      return;
    }

    const filteredEducation = dt.educations.filter(
      (d) => d.degree !== "" || d.duration !== "" || d.university !== ""
    );
    const filteredAwards = dt.awards.filter(
      (d) => d.date !== "" || d.description !== "" || d.title !== ""
    );
    const filteredWorkExp = dt.workExperiences.filter(
      (d) => d.clinic !== "" || d.duration !== ""
    );
    // console.log({...data,educations:filteredEducation,awards:filteredAwards,workExperiences:filteredWorkExp});
    if (filteredEducation.length === 0) {
      console.log("here");
      setError("educations", {
        message: "Education is required",
        type: "required",
      });
      return;
    }

    if (filteredWorkExp.length === 0) {
      setError("workExperiences", {
        message: "This field is required",
        type: "required",
      });
      return;
    }
    const {
      fee,
      id,
      user,
      userId,
      description,
      mode,
      isAvailableForDesk,
      status,
      schedules,
    } = dt;
    const newData = {
      Fname: user.Fname,
      Lname: user.Lname,
      age: user.age,
      dob: dobDate,
      bloodGroup: user.bloodGroup,
      address: user.address,
      contact: user.contact,
      fee: fee,
      specializations: specialization,
      educations: filteredEducation,
      awards: filteredAwards,
      workExperiences: filteredWorkExp,
      schedules,
      description,
      doctorProfileId: id,
      userId: userId,
      mode,
      isAvailableForDesk
    };

    console.log(dt.workExperiences, filteredWorkExp);

    const stat = "PENDING";

    console.log(newData);
    const res = await updateDoctorProfile({ ...newData, status: stat });

    // console.log(res);

    if (res?.status === 201) {
      const payload = {
        Fname: res.data.user.Fname,
        Lname: res.data.user.Lname,
        dob: res.data.user.dob,
        bloodGroup: res.data.user.bloodGroup,
        contact: res.data.user.contact,
        Address: res.data.user.address,
        gender: res.data.user.gender,
      };

      await session.update({
        ...session,
        data: res.data.user,
      });

      // setRefresh(true);
    }
  };

  const handleOnFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleOnProfileChange = async () => {
    if (!session || !session.data?.data) {
      return alert("Session Expired,refresh the page");
    }
    if (!file) {
      return alert("No File Selected");
    }

    const formData = new FormData();
    formData.append("profileImage", file);
    formData.set("userId", session.data.data.id);
    console.log(formData);

    console.log(formData.get("userId"));


    

    const res = await UpdateProfileImage(formData);

    if (!res) {
      return alert("Error Uploading Image");
    }

    const { profilePic, ...rest } = session.data.data;

    const newData = {
      ...rest,
      profilePic: res.profilePic,
    };

    //update session
    await session.update({
      ...session,
      data: newData,
    });

    // console.log(res);
  };

  return (
    <>
      {/* Basic Information */}
      <form onSubmit={handleSubmit(submit)}>
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Basic Information</h4>
            <div className="row form-row">
              <div className="col-md-12">
                <div className="form-group">
                  <div className="change-avatar">
                    <div className="profile-img">
                      <img
                        src={`${
                          session?.data?.data.profilePic
                            ? `https://storage.googleapis.com/kiitconnect_bucket/doctorProfile/${session.data.data.profilePic}`
                            : "/assets/doctor-2.jpg"
                        } `}
                        alt="User Image"
                      />
                    </div>
                    <div className="upload-img  flex flex-col">
                      <div className="change-photo-btn">
                        <span>
                          <i className="fa fa-upload" /> Edit Image
                        </span>
                        <input
                          onChange={handleOnFileChange}
                          type="file"
                          className="upload"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleOnProfileChange}
                        className=" w-[150px] btn btn-primary"
                      >
                        Save{" "}
                      </button>
                      <small className="form-text text-muted">
                        Allowed JPG, GIF or PNG. Max size of 2MB
                      </small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    disabled
                    {...register("user.username")}
                    type="text"
                    className="form-control"
                  />
                  {errors.user?.username && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    {...register("user.email")}
                    className="form-control"
                  />
                  {errors.user?.email && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register("user.Fname")}
                    type="text"
                    className="form-control"
                  />
                  {errors.user?.Fname && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register("user.Lname")}
                    type="text"
                    className="form-control"
                  />
                  {errors.user?.Lname && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    {...register("user.contact")}
                    className="form-control"
                  />
                  {errors.user?.contact && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Gender</label> <span className="text-danger">*</span>
                  <select
                    {...register("user.gender")}
                    className="form-control select"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  {errors.user?.gender && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-0 flex flex-col">
                  <label>
                    Date of Birth <span className="text-danger">*</span>
                  </label>
                  <DatePickerDemo />
                  {errors.user?.dob && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>

                {/* <DatePicker selected={"2022-10-2"} onChange={(date) => dispatch(setDob(date))} /> */}

                {/* <DatePicker selected={new Date(dob)} onChange={(date) => dispatch(setDob(date))} /> */}
              </div>
            </div>
          </div>
        </div>
        {/* /Basic Information */}
        {/* About Me */}
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">About Me</h4>
            <div className="form-group mb-0">
              <label>Biography</label>
              <textarea
                {...register("description")}
                className="form-control"
                rows={5}
                defaultValue={""}
              />
              {errors.description && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
          </div>
        </div>
        {/* /About Me */}

        <div className="card">
          <div className="card-body">
            <div className="card-title">Choose Mode for Appointment</div>

            <div className="col-md-6">
                <div className="form-group">
                  <label>Mode</label> <span className="text-danger">*</span>
                  <select
                    {...register("mode")}
                    className="form-control select"
                  >
                    <option>ONLINE</option>
                    <option>OFFLINE</option>
                  </select>
                  {errors.mode && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckChecked"
                {...register('isAvailableForDesk')}
                defaultChecked={getValues("isAvailableForDesk")}
              />
              <label className="form-check-label" htmlFor="flexCheckChecked">
                Checked checkbox
              </label>
            </div>
          </div>
        </div>

        {/* Clinic Info */}
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">
              Clinic Info <span className="text-danger">*</span>
            </h4>
            {experienceArr.map((w, i) => {
              return (
                <div className="row form-row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Clinic Name</label>
                      <input
                        {...register(`workExperiences.${i}.clinic`)}
                        type="text"
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Clinic Address</label>
                      <input
                        {...register(`workExperiences.${i}.duration`)}
                        type="text"
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="add-more my-2">
                    <button
                      type="button"
                      onClick={() => {
                        removeexperience(i);
                      }}
                      className="add-award bg-red-500 px-2 py-1 text-white rounded-md"
                    >
                      <i className="bg-red-500" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {errors?.workExperiences && (
              <span className="text-danger">This field is required</span>
            )}

            <div className="add-more mt-2 text-blue-600">
              <button
                type="button"
                onClick={() => {
                  appendexperience({
                    clinic: "",
                    duration: "",
                  });
                  clearErrors("workExperiences");
                }}
                className="add-experience"
              >
                <i className="fa fa-plus-circle" /> Add More
              </button>
            </div>
          </div>
        </div>
        {/* /Clinic Info */}
        {/* Contact Details */}
        <div className="card contact-card">
          <div className="card-body">
            <h4 className="card-title">Address</h4>
            <div className="row form-row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>
                    Address Line 1 <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register("user.address.address")}
                    type="text"
                    className="form-control"
                  />
                  {errors?.user?.address?.address && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              {/* <div className="col-md-6">
        <div className="form-group">
          <label className="control-label">Address Line 2</label>
          <input type="text" className="form-control" />
        </div>
      </div> */}
              <div className="col-md-6">
                <div className="form-group">
                  <label className="control-label">
                    City <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register("user.address.city")}
                    type="text"
                    className="form-control"
                  />
                  {errors?.user?.address?.city && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="control-label">
                    State / Province <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register("user.address.state")}
                    type="text"
                    className="form-control"
                  />
                  {errors?.user?.address?.state && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="control-label">
                    Country <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register("user.address.country")}
                    type="text"
                    className="form-control"
                  />
                  {errors?.user?.address?.country && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="control-label">
                    Postal Code <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register("user.address.pincode")}
                    type="text"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Contact Details */}
        {/* Pricing
<div className="card">
  <div className="card-body">
    <h4 className="card-title">Pricing</h4>
    <div className="form-group mb-0">
      <div id="pricing_select">
        <div className="custom-control custom-radio custom-control-inline">
          <input
            type="radio"
            id="price_free"
            name="rating_option"
            className="custom-control-input"
            defaultValue="price_free"
          //   defaultChecked=""
          />
          <label className="custom-control-label" htmlFor="price_free">
            Free
          </label>
        </div>
        <div className="custom-control custom-radio custom-control-inline">
          <input
            type="radio"
            id="price_custom"
            name="rating_option"
            defaultValue="custom_price"
            className="custom-control-input"
          />
          <label className="custom-control-label" htmlFor="price_custom">
            Custom Price (per hour)
          </label>
        </div>
      </div>
    </div>
    <div
      className="row custom_price_cont"
      id="custom_price_cont"
      style={{ display: "none" }}
    >
      <div className="col-md-4">
        <input
          type="text"
          className="form-control"
          id="custom_rating_input"
          name="custom_rating_count"
          defaultValue=""
          // placeholder={20}
        />
        <small className="form-text text-muted">
          Custom price you can add
        </small>
      </div>
    </div>
  </div>
</div> */}
        {/* /Pricing */}
        {/* Services and Specialization */}
        <div className="card services-card">
          <div className="card-body">
            <h4 className="card-title">Services and Specialization</h4>
            {/* <div className="form-group">
      <label>Services</label>
     <TagInput handleOnDelete={handleOnRemoveServices} handleOnSetValues={handleOnSetServices} values={services} />
      <small className="form-text text-muted">
        Note : Type &amp; Press enter to add new services
      </small>

      
    </div> */}
            <div className="form-group mb-0">
              <label>Specialization </label>
              <TagInput
                handleOnDelete={handleOnRemoveSpecialization}
                handleOnSetValues={handleOnSetSpecialization}
              />
              <small className="form-text text-muted">
                Note : Type &amp; Press enter to add new specialization
              </small>
            </div>
          </div>
        </div>
        {/* /Services and Specialization */}
        {/* Education */}
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Education</h4>
            <div className="education-info">
              <div className="row form-row education-cont">
                <div className="col-12 col-md-10 col-lg-11">
                  {educationArr.map((ed, i) => {
                    return (
                      <div className="row form-row">
                        <div className="col-12 col-md-6 col-lg-4">
                          <div className="form-group">
                            <label>Degree</label>
                            <input
                              {...register(`educations.${i}.degree`)}
                              type="text"
                              className="form-control"
                            />
                          </div>
                        </div>

                        <div className="col-12 col-md-6 col-lg-4">
                          <div className="form-group">
                            <label>College/Institute</label>
                            <input
                              {...register(`educations.${i}.university`)}
                              type="text"
                              className="form-control"
                            />
                          </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-4">
                          <div className="form-group">
                            <label>Year of Completion</label>
                            <input
                              {...register(`educations.${i}.duration`)}
                              type="text"
                              className="form-control"
                            />
                          </div>
                        </div>

                        <div className="add-more my-2">
                          <button
                            type="button"
                            onClick={() => {
                              removeEducation(i);
                            }}
                            className="add-award bg-red-500 px-2 py-1 text-white rounded-md"
                          >
                            <i className="bg-red-500" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {errors?.educations && (
                    <span className="text-danger">This field is required</span>
                  )}
                </div>
              </div>
            </div>

            <div className="add-more mt-2 text-blue-500">
              <div
                onClick={() => {
                  console.log("cliecked");

                  appendEducation({
                    degree: "",
                    university: "",
                    duration: "",
                  });

                  clearErrors("educations");

                  //remove errors
                }}
                className="add-education cursor-pointer"
              >
                <i className="fa fa-plus-circle" /> Add More
              </div>
            </div>
          </div>
        </div>
        {/* /Education */}
        {/* Experience */}
        {/* <div className="card">
  <div className="card-body">
    <h4 className="card-title">Experience</h4>
    <div className="experience-info">
      <div className="row form-row experience-cont">
        <div className="col-12 col-md-10 col-lg-11">
      {
        experienceArr.map((ex,i)=>{
            return <div className="row form-row">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="form-group">
                <label>Hospital Name</label>
                <input  type="text" className="form-control" />
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <div className="form-group">
                <label>From</label>
                <input type="text" className="form-control" />
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <div className="form-group">
                <label>To</label>
                <input type="text" className="form-control" />
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <div className="form-group">
                <label>Designation</label>
                <input type="text" className="form-control" />
              </div>
            </div>
          </div>
        
      })}



        </div>
      </div>
    </div>
    <div className="add-more">
      <a href="javascript:void(0);" className="add-experience">
        <i className="fa fa-plus-circle" /> Add More
      </a>
    </div>
  </div>
</div> */}
        {/* /Experience */}
        {/* Awards */}
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Awards</h4>
            <div className="awards-info">
              {awardsArr.map((a, i) => {
                return (
                  <div className="row form-row awards-cont">
                    <div className="col-12 col-md-5">
                      <div className="form-group">
                        <label>Awards</label>
                        <input
                          {...register(`awards.${i}.title`, { required: true })}
                          type="text"
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-5">
                      <div className="form-group">
                        <label>Year</label>
                        <input
                          {...register(`awards.${i}.date`, { required: true })}
                          type="text"
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-8">
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          {...register(`awards.${i}.description`, {
                            required: true,
                          })}
                          className="form-control"
                        />
                      </div>
                      <div className="add-more my-2">
                        <button
                          type="button"
                          onClick={() => {
                            removeAwards(i);
                          }}
                          className="add-award bg-red-500 px-2 py-1 text-white rounded-md"
                        >
                          <i className="bg-red-500" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors?.awards && (
              <span className="text-danger">This field is required</span>
            )}
            <div className="add-more mt-3">
              <button
                type="button"
                onClick={() => {
                  appendAwards({
                    date: "",
                    description: "",
                    title: "",
                  });
                }}
                className="add-award text-blue-600"
              >
                <i className=" text-blue-500" /> Add More
              </button>
            </div>
          </div>
        </div>
        {/* /Awards */}

        {datas.status === "PENDING" ? (
          <div>
            <button
              type="button"
              className="bg-blue-600 text-white rounded-md px-2 py-1"
            >
              Submitted for Review
            </button>
          </div>
        ) : (
          <div className="submit-section submit-btn-bottom">
            <button type="submit" className="btn btn-primary submit-btn">
              Submit For Verification
            </button>
          </div>
        )}
      </form>
    </>
  );
};

export default DoctorDashboard;
