import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import moment from 'moment'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form"

export interface Event {
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
}

export interface EventFormValues {
  title: string;
  description?: string;
  location: string;
  start: Date;
  end: Date;
}

export const eventFormSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tên sự kiện"),
  description: z.string().optional(),
  location: z.string().min(1, "Vui lòng chọn sân"),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
}).refine((data) => {
  const start = moment(`${data.startDate} ${data.startTime}`);
  const end = moment(`${data.endDate} ${data.endTime}`);
  return end.isAfter(start);
}, {
  message: "Thời gian kết thúc phải sau thời gian bắt đầu",
  path: ["endTime"],
});

type FormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  event?: Event | null;
  initialSlot?: { start: Date; end: Date } | null;
  onSubmit: (values: EventFormValues) => void;
  onCancel: () => void;
}

export function EventForm({ event, initialSlot, onSubmit, onCancel }: EventFormProps) {
  const defaultStart = event?.start || initialSlot?.start || new Date();
  const defaultEnd = event?.end || initialSlot?.end || new Date();

  const form = useForm<FormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      location: event?.location || "",
      startDate: moment(defaultStart).format('YYYY-MM-DD'),
      startTime: moment(defaultStart).format('HH:mm'),
      endDate: moment(defaultEnd).format('YYYY-MM-DD'),
      endTime: moment(defaultEnd).format('HH:mm'),
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Use strict parsing with explicit format
    const startDateTime = moment(`${values.startDate} ${values.startTime}`, 'YYYY-MM-DD HH:mm', true);
    const endDateTime = moment(`${values.endDate} ${values.endTime}`, 'YYYY-MM-DD HH:mm', true);
    
    console.log('Form values:', values);
    console.log('Start time (local):', startDateTime.format('YYYY-MM-DD HH:mm'));
    console.log('End time (local):', endDateTime.format('YYYY-MM-DD HH:mm'));
  
    // Convert form values to EventFormValues with proper Date objects
    const eventValues: EventFormValues = {
      title: values.title,
      description: values.description,
      location: values.location,
      start: startDateTime.toDate(),
      end: endDateTime.toDate(),
    };
    
    onSubmit(eventValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên sự kiện</FormLabel>
              <FormControl>
                <input 
                  {...field} 
                  className="w-full p-2 border rounded"
                  placeholder="Nhập tên sự kiện"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày bắt đầu</FormLabel>
                <FormControl>
                  <input 
                    type="date" 
                    {...field}
                    className="w-full p-2 border rounded" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giờ bắt đầu</FormLabel>
                <FormControl>
                  <input 
                    type="time" 
                    {...field}
                    className="w-full p-2 border rounded" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày kết thúc</FormLabel>
                <FormControl>
                  <input 
                    type="date" 
                    {...field}
                    className="w-full p-2 border rounded" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giờ kết thúc</FormLabel>
                <FormControl>
                  <input 
                    type="time" 
                    {...field}
                    className="w-full p-2 border rounded" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sân</FormLabel>
              <FormControl>
                <select 
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...field}
                >
                  <option value="">Chọn sân</option>
                  <option value="Sân số 1">Sân số 1</option>
                  <option value="Sân số 2">Sân số 2</option>
                  <option value="Sân số 3">Sân số 3</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <textarea 
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập mô tả..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            {event ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </form>
    </Form>
  );
}
export default EventForm;