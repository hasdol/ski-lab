'use client';
import React from 'react';
import { RiVerifiedBadgeFill, RiDeleteBinLine, RiUser6Line } from "react-icons/ri";
import { useAuth } from '@/context/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import ManageSubscription from '@/app/(protected)/account/components/AccountManageSubscription';
import Spinner from '@/components/common/Spinner/Spinner';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import PageHeader from '@/components/layout/PageHeader'; // Add this import
import Card from '@/components/ui/Card'

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('nb-NO', options);
};

const ProfileImageSection = ({ userData, updateProfileImage, deleteProfileImage, isChangingImg }) => {
    const handleRemoveImage = async () => {
        if (window.confirm('Are you sure you want to remove the image?')) {
            await deleteProfileImage();
        }
    };

    return (
        <div className="relative text-center mx-auto">
            <UploadableImage
                photoURL={userData?.photoURL}
                handleImageChange={updateProfileImage}
                variant="profile"
                clickable={true}
            />
            {userData?.photoURL && (
                <Button
                    onClick={handleRemoveImage}
                    variant="danger"
                    disabled={isChangingImg}
                    className="mt-2"
                >
                    {isChangingImg ? (
                        <Spinner className="mx-auto" />
                    ) : (
                        <span className="flex items-center justify-center text-xs">
                            <RiDeleteBinLine className="mr-1" />
                            Remove
                        </span>
                    )}
                </Button>
            )}
        </div>
    );
};

const ProfileInfoSection = ({ user, userData, errorMessage, router }) => {
    return (
        <div className="space-y-4 text-center md:text-left">
            <div className="mb-6">
                <p className="text-gray-500 text-lg mb-1">Hello</p>
                <h1 className="font-bold text-3xl text-gray-800 mb-3">
                    {userData?.displayName || 'Guest'}
                </h1>
                {userData && (
                    <div className="mb-6">
                        {userData.plan === 'free' ? (
                            <p className="inline-flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 font-semibold px-4 py-1.5 rounded-full text-sm">
                                Free user
                            </p>
                        ) : (
                            <p className="inline-flex items-center justify-center gap-1.5 bg-blue-100 text-blue-600 font-semibold px-4 py-1.5 rounded-full text-sm">
                                {`${userData.plan} plan`}
                                <RiVerifiedBadgeFill className="w-4 h-4" />
                            </p>
                        )}
                    </div>
                )}
                {user?.email && (
                    <p className="text-gray-600 text-sm">
                        Email: {user.email}
                    </p>
                )}
            </div>

            {errorMessage && (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-2xl">
                    {errorMessage}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
                <ManageSubscription />
                <Button
                    onClick={() => router.push('/account/settings')}
                    variant="secondary"
                    className="w-full md:w-auto"
                >
                    Settings
                </Button>
            </div>

            <div>
                <p className="text-sm text-gray-500">
                    Joined: <span className="font-medium">
                        {user?.metadata.creationTime ? formatDate(user.metadata.creationTime) : ''}
                    </span>
                </p>
            </div>
        </div>
    );
};

const Account = () => {
    const { user, userData } = useAuth();
    const { isChangingImg, errorMessage, updateProfileImage, deleteProfileImage } = useProfileActions(user);
    const router = useRouter();

    return (
        <div className="p-4 max-w-4xl w-full self-center">
            <PageHeader
                icon={<RiUser6Line className="text-blue-600 text-2xl" />}
                title="Account"
                subtitle="Manage your account"
                actions={null}
            />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
                    <ProfileImageSection
                        userData={userData}
                        updateProfileImage={updateProfileImage}
                        deleteProfileImage={deleteProfileImage}
                        isChangingImg={isChangingImg}
                    />
                    <ProfileInfoSection
                        user={user}
                        userData={userData}
                        errorMessage={errorMessage}
                        router={router}
                    />
                </div>
            </Card>
        </div>
    );
};

export default Account;