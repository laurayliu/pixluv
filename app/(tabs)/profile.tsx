import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Pressable} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.main_container}>
      <View style={styles.profile_header}>
        <View style={styles.profile_box}>
          <IconSymbol name="profile" color={"currentColor"}/>        
        </View>

        <View style={styles.info_container}>
          <Text style={styles.username}>{user?.username ?? 'your profile'}</Text>
          <Text style={styles.texts}>Bio goes here oooh</Text>
          <View style={styles.action_container}>
            {/* Needd to add edit button instead for personal profile view */}
            <Pressable style={styles.action_button}>
              <Text style={styles.button_text}>Follow</Text>
            </Pressable>

            <Pressable style={styles.action_button}>
              <Text  style={styles.button_text}>Pix Me!</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.favorite_container}>
        <View style={styles.sticker_container}>
          <Text style={[styles.texts, {textAlign: 'center' }]}>Sticker Collection</Text>
          <View style={styles.sticker_box}>
            <View style={styles.sticker}>
              {/* use image here to display the sticker */}
              {/* <Image
                source={{ uri: item.imageUrl }}
              /> */}
            </View>

            <View style={styles.sticker}>
              {/* use image here to display the sticker */}
            </View>
          </View>
        </View>

        <View style={styles.main_color}>
          <Text style={[styles.texts, {textAlign: 'center'}]}>Favorite Colors</Text>

          <View style={styles.pallete_box}>
            <View style={styles.color_row}>
              <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>
            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>

            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>          
            </View>

            <View style={styles.color_row}>
              <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>
            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>

            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>          
            </View>
          </View>


          <View>
            {/* <Text>Edit tton</Text> */}
          </View>
        </View>
      </View>

      <View style={styles.book_container}>
      </View>
    </View>
  );
};

      {/* <View style={styles.container}>

      </View> */}

       {/* <Text style={styles.username}>{user?.username ?? 'your profile'}</Text>
      <Text style={styles.email}>{user?.email}</Text> */}
      {/* <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>log out</Text>
      </TouchableOpacity>  */}

const styles = StyleSheet.create({
  main_container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#5174CF'
  },
  profile_header: {
    display: 'flex',
    marginTop: 90,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    width: '100%',
  },
  profile_box: {
    height: 92,
    width: 92,
    padding: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  info_container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    marginLeft: 12,
  },
  action_container: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  main_color: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: 110,
    alignContent: 'center',
    justifyContent: 'flex-end'
  },
  color_row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  action_button: {
    display: 'flex',
    justifyContent: 'center',
    height: 33,
    width: '48%',
    fontSize: 15,
    backgroundColor: '#FF004D',
  },
  button_text: {
    width: '100%',
    color: '#ffffff',
    justifyContent: 'center',
    alignContent: 'center',
    textAlign: 'center'
  },
  username: {
    fontSize: 25,
    fontWeight: '700',
    color: '#ffffff',
  },
  texts: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 5,
  },
  favorite_container: {
    display: 'flex',
    height: 115,
    width: '80%', 
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center' 
  },
  sticker_container: {
    width: 160,
    height: '100%',
    marginRight: 40,
    justifyContent: 'flex-end'
  },
  sticker_box: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row'
  },
  sticker: {
    backgroundColor: '#382979',
    height: 75,
    width: 75,
  },
  pallete_box: {
    backgroundColor: '#d0d0d0',
    height: 75,
    width: 110,
    justifyContent: 'center'
  },
  color_box: {
    height: 28,
    width: 28,
    margin: 2,
    backgroundColor: '#a14c67',
    justifyContent: 'center',
    alignContent: 'center',
    alignSelf: 'center',
  },
  book_container: {
    display: 'flex',
    marginTop: 15,
    alignSelf: 'center',
    width: '90%',
    height: '70%'
  },
  email: {
    fontSize: 14,
    color: '#ff6161',
    marginBottom: 40,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#ff6161',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  logoutText: {
    color: '#ff6161',
    fontWeight: '700',
    letterSpacing: 1,
  },

});

export default Profile;