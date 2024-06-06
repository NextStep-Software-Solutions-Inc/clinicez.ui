import { ICarouselItemProps } from "@components/CarouselItem";
import CarouselWrapper from "@components/CarouselWrapper";
import { getNursesAction } from "@actions/nurse.action";

export default  async function NurseList() {
  const nurses = await getNursesAction();
  
  const mappedNurses: ICarouselItemProps["item"][] = nurses.map((nurse) => {
    return {
      id: nurse.id,
      name: `${nurse.title} ${nurse.name} ${nurse.suffix}`,
      fields: nurse.fields,
      photoUrl: nurse.picture ?? "https://via.placeholder.com/1000",
      type: "NURSE"
    }
  })
  return (
    <div className='flex flex-col gap-10'>
      <div>
        <CarouselWrapper
          items={mappedNurses}
        />
      </div>
    </div> 
  );
}
