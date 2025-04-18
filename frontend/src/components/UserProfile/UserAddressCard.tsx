import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../ui/form/input/InputField";
import Label from "../ui/form/Label";
import { useUserProfile } from "../../context/UserProfileContext";
import { useState } from "react";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    home_street: profile?.home_street || '',
    home_house_number: profile?.home_house_number || '',
    home_post_code: profile?.home_post_code || '',
    home_city: profile?.home_city || '',
    work_street: profile?.work_street || '',
    work_house_number: profile?.work_house_number || '',
    work_post_code: profile?.work_post_code || '',
    work_city: profile?.work_city || '',
  });

  // Update form data when profile changes
  useState(() => {
    if (profile) {
      setFormData({
        home_street: profile.home_street || '',
        home_house_number: profile.home_house_number || '',
        home_post_code: profile.home_post_code || '',
        home_city: profile.home_city || '',
        work_street: profile.work_street || '',
        work_house_number: profile.work_house_number || '',
        work_post_code: profile.work_post_code || '',
        work_city: profile.work_city || '',
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(formData);
      closeModal();
    } catch (error) {
      console.error('Failed to update address:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address
            </h4>

            <div className="space-y-6">
              {/* Home Address Section */}
              <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <h5 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">Home Address</h5>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                  <div>
                    <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Street & Number
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {profileLoading ? 'Loading...' : profile?.home_street ?
                        `${profile.home_street} ${profile.home_house_number || ''}` :
                        'Not set'}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Postal Code & City
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {profileLoading ? 'Loading...' : profile?.home_post_code || profile?.home_city ?
                        `${profile.home_post_code || ''} ${profile.home_city || ''}` :
                        'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Address Section */}
              <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <h5 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">Work Address</h5>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                  <div>
                    <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Street & Number
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {profileLoading ? 'Loading...' : profile?.work_street ?
                        `${profile.work_street} ${profile.work_house_number || ''}` :
                        'Not set'}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Postal Code & City
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {profileLoading ? 'Loading...' : profile?.work_post_code || profile?.work_city ?
                        `${profile.work_post_code || ''} ${profile.work_city || ''}` :
                        'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Address
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* Home Address Section */}
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Home Address</h5>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
                    <div>
                      <Label>Street</Label>
                      <Input
                        type="text"
                        name="home_street"
                        value={formData.home_street}
                        onChange={handleChange}
                        placeholder="Street name"
                      />
                    </div>

                    <div>
                      <Label>House Number</Label>
                      <Input
                        type="text"
                        name="home_house_number"
                        value={formData.home_house_number}
                        onChange={handleChange}
                        placeholder="House number"
                      />
                    </div>

                    <div>
                      <Label>Postal Code</Label>
                      <Input
                        type="text"
                        name="home_post_code"
                        value={formData.home_post_code}
                        onChange={handleChange}
                        placeholder="Postal code"
                      />
                    </div>

                    <div>
                      <Label>City</Label>
                      <Input
                        type="text"
                        name="home_city"
                        value={formData.home_city}
                        onChange={handleChange}
                        placeholder="City"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Address Section */}
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Work Address</h5>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
                    <div>
                      <Label>Street</Label>
                      <Input
                        type="text"
                        name="work_street"
                        value={formData.work_street}
                        onChange={handleChange}
                        placeholder="Street name"
                      />
                    </div>

                    <div>
                      <Label>House Number</Label>
                      <Input
                        type="text"
                        name="work_house_number"
                        value={formData.work_house_number}
                        onChange={handleChange}
                        placeholder="House number"
                      />
                    </div>

                    <div>
                      <Label>Postal Code</Label>
                      <Input
                        type="text"
                        name="work_post_code"
                        value={formData.work_post_code}
                        onChange={handleChange}
                        placeholder="Postal code"
                      />
                    </div>

                    <div>
                      <Label>City</Label>
                      <Input
                        type="text"
                        name="work_city"
                        value={formData.work_city}
                        onChange={handleChange}
                        placeholder="City"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2">Saving...</span>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
